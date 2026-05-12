"use server";

import { prisma } from "@/lib/db/prisma";

export async function getJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      _count: { select: { applicants: true } },
      stages: { orderBy: { order: "asc" } },
    },
  });
}
