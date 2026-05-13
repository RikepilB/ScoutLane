"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { dispatchWebhook } from "@/lib/webhook";
import { requireSession } from "@/server/services/_lib/validate-session";
import { z } from "zod";

const validStatuses = z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]);

export async function moveApplicant(applicantId: string, newStatus: string) {
  const user = await requireSession();
  const valid = validStatuses.safeParse(newStatus);
  if (!valid.success) return { success: false, error: "Invalid status" };

  const existing = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { status: true, jobId: true, job: { select: { organizationId: true, title: true } } },
  });
  if (!existing || existing.job.organizationId !== user.organizationId) {
    return { success: false, error: "Applicant not found" };
  }

  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: valid.data },
    include: { job: { select: { title: true } } },
  });

  await prisma.stageTransition.create({
    data: {
      applicantId,
      jobId: existing.jobId,
      fromStage: existing.status,
      toStage: valid.data,
      changedById: user.id,
    },
  });

  const webhooks = await prisma.webhook.findMany({
    where: {
      active: true,
      events: { has: "applicant.status_changed" },
    },
  });

  for (const webhook of webhooks) {
    dispatchWebhook(webhook.id, "applicant.status_changed", {
      applicantId: applicant.id,
      name: applicant.name,
      email: applicant.email,
      status: valid.data,
      jobTitle: applicant.job.title,
    }).catch(() => {});
  }

  const integrations = await prisma.jobIntegration.findMany({
    where: { jobId: existing.jobId, active: true },
    include: { stage: true },
  });

  for (const integration of integrations) {
    if (integration.stage.name.toUpperCase() !== valid.data) continue;

    const payload: Record<string, unknown> = {
      event: "stage_transition",
      timestamp: new Date().toISOString(),
      candidate: {
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        resumeUrl: applicant.resumeUrl,
      },
    };

    if (integration.includeQuestions) {
      const template = await prisma.jobTemplate.findFirst({
        where: { organizationId: user.organizationId },
        select: { name: true, questions: true },
      });
      if (template?.questions) {
        payload.assessment = {
          title: template.name,
          description: "Please answer each question concisely.",
          questions: (template.questions as Array<{ text: string; maxDurationSeconds?: number; maxAttempts?: number }>),
        };
      }
    }

    try {
      const response = await fetch(integration.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(integration.apiKey ? { Authorization: `Bearer ${integration.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          event: "stage_transition",
          status: response.status,
          requestBody: JSON.stringify(payload).slice(0, 10000),
          responseBody: (await response.text().catch(() => null))?.slice(0, 10000) ?? null,
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
        },
      });

      await prisma.jobIntegration.update({
        where: { id: integration.id },
        data: { lastFailureAt: new Date(), failureCount: { increment: 1 } },
      });
    }
  }

  revalidatePath("/admin/jobs/[id]/pipeline");
  return { success: true };
}
