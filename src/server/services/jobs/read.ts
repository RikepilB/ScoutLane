"use server";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

export async function getJob(id: string) {
  const user = await requireSession();

  return prisma.job.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      _count: { select: { applicants: true } },
      stages: { orderBy: { order: "asc" } },
    },
  });
}
