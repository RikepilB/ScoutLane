"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export interface UpdateJobInput {
  title?: string;
  description?: string;
  location?: string;
  type?: string;
  salary?: string;
  published?: boolean;
  archived?: boolean;
}

export async function updateJob(id: string, data: UpdateJobInput) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };

  await prisma.job.update({ where: { id }, data });
  revalidatePath(`/admin/jobs/${id}`);
  return { success: true };
}

export async function saveCustomFields(jobId: string, customFields: any[]) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };

  await prisma.job.update({
    where: { id: jobId },
    data: { customFields },
  });
  revalidatePath(`/admin/jobs/${jobId}/form`);
  return { success: true };
}
