"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

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
