"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";
import type { JobActionResult } from "@/schemas/job";

export async function deleteJob(id: string): Promise<JobActionResult> {
  const user = await requireSession();

  const result = await prisma.job.deleteMany({
    where: { id, organizationId: user.organizationId },
  });

  if (result.count === 0) return { success: false, error: "Job not found" };

  revalidatePath("/admin/jobs");
  return { success: true };
}
