"use server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export async function getPipelineData(jobId: string) {
  const user = await requireSession();

  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!job) throw new Error("Job not found");

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
