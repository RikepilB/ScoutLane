"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

async function assertJobAccess(jobId: string, organizationId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    select: { id: true },
  });
  if (!job) throw new Error("Job not found");
}

async function assertStageAccess(stageId: string, organizationId: string) {
  const stage = await prisma.pipelineStage.findUnique({
    where: { id: stageId },
    select: { job: { select: { organizationId: true } } },
  });
  if (!stage || stage.job.organizationId !== organizationId) throw new Error("Stage not found");
}

export async function createStage(jobId: string, name: string, color?: string) {
  const user = await requireSession();
  await assertJobAccess(jobId, user.organizationId);

  const maxOrder = await prisma.pipelineStage.findFirst({
    where: { jobId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.pipelineStage.create({
    data: {
      jobId,
      name,
      color: color ?? "#6366f1",
      order: (maxOrder?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/jobs/${jobId}/stages`);
}

export async function updateStage(stageId: string, data: { name?: string; color?: string; order?: number }) {
  const user = await requireSession();
  await assertStageAccess(stageId, user.organizationId);

  await prisma.pipelineStage.update({ where: { id: stageId }, data });
  revalidatePath("/admin/jobs/[id]/stages");
}

export async function deleteStage(stageId: string, reassignToStageId?: string) {
  const user = await requireSession();
  await assertStageAccess(stageId, user.organizationId);

  const stage = await prisma.pipelineStage.findUnique({
    where: { id: stageId },
    select: { name: true, jobId: true },
  });
  if (!stage) throw new Error("Stage not found");

  let targetStageId = reassignToStageId ?? null;
  if (!targetStageId) {
    const fallback = await prisma.pipelineStage.findFirst({
      where: { jobId: stage.jobId, id: { not: stageId } },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    targetStageId = fallback?.id ?? null;
  }

  if (targetStageId) {
    await prisma.applicant.updateMany({
      where: { jobId: stage.jobId, pipelineStageId: stageId },
      data: { pipelineStageId: targetStageId, lastStageChangeAt: new Date() },
    });
  }

  await prisma.pipelineStage.delete({ where: { id: stageId } });
  revalidatePath(`/admin/jobs/${stage.jobId}/stages`);
  revalidatePath(`/admin/jobs/${stage.jobId}/pipeline`);

  const affectedCount = targetStageId
    ? await prisma.applicant.count({
        where: { jobId: stage.jobId, pipelineStageId: targetStageId },
      })
    : 0;

  return { success: true as const, applicantCount: affectedCount };
}

export async function reorderStages(stages: { id: string; order: number }[]) {
  const user = await requireSession();

  for (const stage of stages) {
    const existing = await prisma.pipelineStage.findUnique({
      where: { id: stage.id },
      select: { job: { select: { organizationId: true } } },
    });
    if (!existing || existing.job.organizationId !== user.organizationId) {
      throw new Error("Stage not found");
    }

    await prisma.pipelineStage.update({
      where: { id: stage.id },
      data: { order: stage.order },
    });
  }
  revalidatePath("/admin/jobs/[id]/stages");
}
