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
    select: {
      id: true,
      name: true,
      email: true,
      score: true,
      status: true,
      createdAt: true,
      data: true,
      job: { select: { title: true } },
    },
  });

  const mapped = applicants.map((a) => {
    const d = (a.data ?? {}) as { institution?: string; program?: string };
    return { ...a, institution: d.institution ?? null, program: d.program ?? null };
  });

  const grouped = stages.map((stage) => {
    const status = stage.name.toUpperCase() as ApplicationStatus;
    return {
      ...stage,
      applicants: mapped.filter((a) => a.status === status),
    };
  });

  return grouped;
}
