import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { normalizeAssessmentQuestions } from "@/lib/jobs/assessment";
import { dispatchWebhook } from "@/lib/webhook";
import { requireSession } from "@/server/services/_lib/validate-session";

const stageNameToStatus: Record<string, ApplicationStatus> = {
  APPLIED: "NEW",
  NEW: "NEW",
  SCREENING: "REVIEWING",
  REVIEWING: "REVIEWING",
  ASSESSMENT: "REVIEWING",
  SHORTLISTED: "SHORTLISTED",
  INTERVIEW: "INTERVIEW",
  OFFER: "OFFERED",
  OFFERED: "OFFERED",
  HIRED: "OFFERED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
};

function deriveStatus(stageName: string): ApplicationStatus {
  return stageNameToStatus[stageName.toUpperCase()] ?? "REVIEWING";
}

export async function moveApplicantImpl(applicantId: string, newStageId: string) {
  const user = await requireSession();

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
  if (!existing || existing.job.organizationId !== user.organizationId) {
    return { success: false, error: "Applicant not found" };
  }

  const newStage = await prisma.pipelineStage.findUnique({
    where: { id: newStageId },
    select: { id: true, name: true, jobId: true },
  });
  if (!newStage || newStage.jobId !== existing.jobId) {
    return { success: false, error: "Invalid stage" };
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

  const derivedStatus = deriveStatus(newStage.name);
  const now = new Date();

  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      pipelineStageId: newStageId,
      status: derivedStatus,
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
      changedById: user.id,
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
      status: derivedStatus,
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
        const response = await fetch(integration.endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(integration.apiKey ? { Authorization: `Bearer ${integration.apiKey}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const responseText = (await response.text().catch(() => null))?.slice(0, 10000) ?? null;

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

  revalidatePath(`/admin/jobs/${existing.jobId}/pipeline`);
  revalidatePath(`/admin/jobs/${existing.jobId}/applicants`);
  return { success: true };
}
