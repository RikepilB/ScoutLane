import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { normalizeAssessmentQuestions } from "@/lib/jobs/assessment";
import { dispatchWebhook } from "@/lib/webhook";
import { validateEgressUrl } from "@/lib/webhook/validate-egress-url";
import { decryptSecret } from "@/lib/security/integration-secrets";
import { redactIntegrationResponse } from "@/lib/security/integration-response-redaction";
import { requireSession } from "@/server/services/_lib/validate-session";

interface MoveApplicantCoreInput {
  applicantId: string;
  newStageId: string;
  organizationId: string;
  actorUserId: string | null;
  expectedJobId?: string;
}

/**
 * Actor-independent core of a pipeline move: org-scoped lookup, stage validation,
 * the stage/status write, StageTransition record, webhook fan-out, and integration
 * dispatch. No session or Next.js request context required — callable from a
 * worker process (see `moveApplicantFromWorker`) as well as from `moveApplicantImpl`.
 */
export async function moveApplicantCore({
  applicantId,
  newStageId,
  organizationId,
  actorUserId,
  expectedJobId,
}: MoveApplicantCoreInput) {
  const existing = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: {
      pipelineStageId: true,
      status: true,
      jobId: true,
      job: {
        select: {
          organizationId: true,
          title: true,
          assessmentTitle: true,
          assessmentQuestions: true,
        },
      },
    },
  });
  if (
    !existing ||
    existing.job.organizationId !== organizationId ||
    (expectedJobId !== undefined && existing.jobId !== expectedJobId)
  ) {
    return { success: false, code: "NOT_FOUND" as const, error: "Applicant not found" };
  }

  const newStage = await prisma.pipelineStage.findUnique({
    where: { id: newStageId },
    select: { id: true, name: true, jobId: true, status: true },
  });
  if (!newStage || newStage.jobId !== existing.jobId) {
    return { success: false, code: "INVALID_STAGE" as const, error: "Invalid stage" };
  }

  if (existing.pipelineStageId === newStageId) {
    return { success: true, unchanged: true };
  }

  const fromStage = existing.pipelineStageId
    ? await prisma.pipelineStage.findUnique({
        where: { id: existing.pipelineStageId },
        select: { name: true },
      })
    : null;

  const now = new Date();

  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      pipelineStageId: newStageId,
      status: newStage.status,
      lastStageChangeAt: now,
    },
    include: { job: { select: { title: true } } },
  });

  const transition = await prisma.stageTransition.create({
    data: {
      applicantId,
      jobId: existing.jobId,
      fromStage: fromStage?.name ?? existing.status,
      toStage: newStage.name,
      changedById: actorUserId,
    },
  });

  const webhooks = await prisma.webhook.findMany({
    where: { active: true, events: { has: "applicant.status_changed" } },
  });

  for (const webhook of webhooks) {
    dispatchWebhook(webhook.id, "applicant.status_changed", {
      applicantId: applicant.id,
      name: applicant.name,
      email: applicant.email,
      stageId: newStage.id,
      stageName: newStage.name,
      status: newStage.status,
      jobTitle: applicant.job.title,
    }).catch(() => {});
  }

  const integration = await prisma.jobIntegration.findUnique({
    where: { stageId: newStage.id },
    include: { stage: true },
  });

  if (integration && integration.active && integration.jobId === existing.jobId) {
    const payload: Record<string, unknown> = {
      event: "stage_transition",
      timestamp: now.toISOString(),
      candidate: {
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        resumeUrl: applicant.resumeUrl,
      },
    };

    if (integration.includeQuestions) {
      const questions = normalizeAssessmentQuestions(existing.job.assessmentQuestions);
      if (questions.length > 0) {
        payload.assessment = {
          title: existing.job.assessmentTitle ?? applicant.job.title,
          description: "Please answer each question concisely.",
          questions,
        };
      }
    }

    const duplicateSuccess = await prisma.integrationLog.findFirst({
      where: {
        integrationId: integration.id,
        stageTransitionId: transition.id,
        event: "stage_transition",
        status: { gte: 200, lt: 300 },
      },
    });

    if (!duplicateSuccess) {
      try {
        const apiKey = decryptSecret(integration.apiKey);
        await validateEgressUrl(integration.endpointUrl);
        const response = await fetch(integration.endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify(payload),
          redirect: "manual",
          signal: AbortSignal.timeout(10_000),
        });

        const responseText = redactIntegrationResponse(await response.text().catch(() => null))?.slice(0, 10000) ?? null;

        await prisma.integrationLog.create({
          data: {
            integrationId: integration.id,
            event: "stage_transition",
            status: response.status,
            requestBody: JSON.stringify(payload).slice(0, 10000),
            responseBody: responseText,
            stageTransitionId: transition.id,
          },
        });

        if (response.ok) {
          await prisma.jobIntegration.update({
            where: { id: integration.id },
            data: { lastSuccessAt: new Date(), failureCount: 0 },
          });
        } else {
          await prisma.jobIntegration.update({
            where: { id: integration.id },
            data: { lastFailureAt: new Date(), failureCount: { increment: 1 } },
          });
        }
      } catch {
        await prisma.integrationLog.create({
          data: {
            integrationId: integration.id,
            event: "stage_transition",
            status: 0,
            requestBody: JSON.stringify(payload).slice(0, 10000),
            responseBody: "Network error",
            stageTransitionId: transition.id,
          },
        });

        await prisma.jobIntegration.update({
          where: { id: integration.id },
          data: { lastFailureAt: new Date(), failureCount: { increment: 1 } },
        });
      }
    }
  }

  return { success: true as const, jobId: existing.jobId };
}

/**
 * Session-resolving wrapper around {@link moveApplicantCore} — the entry point every
 * existing caller (Kanban board, applicant detail actions, the move REST route) uses.
 * Behavior is unchanged from before the core was extracted.
 *
 * @param expectedJobId Optional defense-in-depth: when provided (e.g. from a
 * REST route's `[id]` segment) the applicant's `jobId` must match, otherwise the
 * move is rejected as not-found. Org-scoping is always enforced via the session.
 */
export async function moveApplicantImpl(
  applicantId: string,
  newStageId: string,
  expectedJobId?: string,
) {
  const user = await requireSession();
  const result = await moveApplicantCore({
    applicantId,
    newStageId,
    organizationId: user.organizationId,
    actorUserId: user.id,
    expectedJobId,
  });

  if (!result.success) return result;

  if (!("unchanged" in result)) {
    revalidatePath(`/admin/jobs/${result.jobId}/pipeline`);
    revalidatePath(`/admin/jobs/${result.jobId}/applicants`);
  }

  const { jobId: _jobId, ...rest } = result;
  return rest;
}

export interface BulkMoveResult {
  movedCount: number;
  unchangedCount: number;
  failed: { applicantId: string; error: string }[];
}

/**
 * Moves multiple applicants to the same stage in one call. Reuses {@link moveApplicantCore}
 * per applicant (so webhooks/integrations/StageTransition all fire exactly as a single move
 * would) but revalidates the affected paths once at the end instead of per-item.
 */
const MAX_BULK_MOVE = 200;

export async function bulkMoveApplicantsImpl(
  applicantIds: string[],
  newStageId: string,
  jobId: string,
): Promise<BulkMoveResult> {
  const user = await requireSession();

  const uniqueIds = [...new Set(applicantIds)].slice(0, MAX_BULK_MOVE);

  let movedCount = 0;
  let unchangedCount = 0;
  const failed: { applicantId: string; error: string }[] = [];

  for (const applicantId of uniqueIds) {
    const result = await moveApplicantCore({
      applicantId,
      newStageId,
      organizationId: user.organizationId,
      actorUserId: user.id,
      expectedJobId: jobId,
    });

    if (!result.success) {
      failed.push({ applicantId, error: result.error ?? "Move failed" });
    } else if ("unchanged" in result) {
      unchangedCount += 1;
    } else {
      movedCount += 1;
    }
  }

  if (movedCount > 0) {
    revalidatePath(`/admin/jobs/${jobId}/pipeline`);
    revalidatePath(`/admin/jobs/${jobId}/applicants`);
  }

  return { movedCount, unchangedCount, failed };
}

/**
 * Worker-safe entry point for moves triggered without a session (auto-advance from
 * the scoring pipeline). Derives `organizationId` from the applicant's own job — no
 * request context available — and records the transition with no actor. Skips
 * `revalidatePath`: a standalone worker process has no Next.js cache to invalidate.
 */
export async function moveApplicantFromWorker(applicantId: string, newStageId: string) {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { job: { select: { organizationId: true } } },
  });
  if (!applicant?.job.organizationId) {
    return { success: false as const, code: "NOT_FOUND" as const, error: "Applicant not found" };
  }

  const result = await moveApplicantCore({
    applicantId,
    newStageId,
    organizationId: applicant.job.organizationId,
    actorUserId: null,
  });

  if (!result.success) return result;
  const { jobId: _jobId, ...rest } = result;
  return rest;
}
