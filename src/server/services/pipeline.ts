"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { z } from "zod";

export async function getPipelineData(jobId: string) {
  const stages = await prisma.pipelineStage.findMany({
    where: { jobId },
    orderBy: { order: "asc" },
  });

  const applicants = await prisma.applicant.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true } } },
  });

  const grouped = stages.map((stage) => {
    const status = stage.name.toUpperCase() as ApplicationStatus;
    return {
      ...stage,
      applicants: applicants.filter((a) => a.status === status),
    };
  });

  return grouped;
}

export async function moveApplicant(applicantId: string, newStatus: string) {
  const valid = z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]).safeParse(newStatus);
  if (!valid.success) return { success: false, error: "Invalid status" };

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: valid.data },
  });

  revalidatePath("/admin/jobs/[id]/pipeline");
  return { success: true };
}

export async function createStage(jobId: string, name: string, color?: string) {
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
  await prisma.pipelineStage.update({ where: { id: stageId }, data });
  revalidatePath("/admin/jobs/[id]/stages");
}

export async function deleteStage(stageId: string) {
  await prisma.pipelineStage.delete({ where: { id: stageId } });
  revalidatePath("/admin/jobs/[id]/stages");
}

export async function reorderStages(stages: { id: string; order: number }[]) {
  for (const stage of stages) {
    await prisma.pipelineStage.update({
      where: { id: stage.id },
      data: { order: stage.order },
    });
  }
  revalidatePath("/admin/jobs/[id]/stages");
}
