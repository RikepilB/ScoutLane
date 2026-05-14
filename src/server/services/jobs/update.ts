"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

export interface UpdateJobInput {
  title?: string;
  description?: string;
  location?: string;
  type?: string;
  salary?: string;
  slug?: string;
  published?: boolean;
  archived?: boolean;
}

export async function updateJob(id: string, data: UpdateJobInput) {
  const user = await requireSession();

  const result = await prisma.job.updateMany({
    where: { id, organizationId: user.organizationId },
    data,
  });

  if (result.count === 0) return { success: false, error: "Job not found" };

  revalidatePath(`/admin/jobs/${id}`);
  return { success: true };
}

export async function saveCustomFields(jobId: string, customFields: any[]) {
  const user = await requireSession();

  const result = await prisma.job.updateMany({
    where: { id: jobId, organizationId: user.organizationId },
    data: { customFields },
  });

  if (result.count === 0) return { success: false, error: "Job not found" };

  revalidatePath(`/admin/jobs/${jobId}/form`);
  return { success: true };
}
