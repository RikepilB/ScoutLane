"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import type { JobActionResult } from "./create";

export async function deleteJob(id: string): Promise<JobActionResult> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };

  await prisma.job.delete({ where: { id } });
  revalidatePath("/admin/jobs");
  return { success: true };
}
