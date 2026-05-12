"use server";

import { prisma } from "@/lib/db/prisma";
import type { ApplicationStatus } from "@/generated/prisma/enums";

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
