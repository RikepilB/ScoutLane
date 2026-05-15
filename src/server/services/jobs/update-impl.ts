import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { UpdateJobInput } from "@/schemas/job";
import { requireSession } from "@/server/services/_lib/validate-session";

export async function updateJobImpl(id: string, data: UpdateJobInput) {
  const user = await requireSession();

  const result = await prisma.job.updateMany({
    where: { id, organizationId: user.organizationId },
    data,
  });

  if (result.count === 0) return { success: false, error: "Job not found" };

  revalidatePath(`/admin/jobs/${id}`);
  return { success: true };
}

export async function saveCustomFieldsImpl(jobId: string, customFields: unknown[]) {
  const user = await requireSession();

  const result = await prisma.job.updateMany({
    where: { id: jobId, organizationId: user.organizationId },
    data: { customFields: customFields as Prisma.InputJsonValue },
  });

  if (result.count === 0) return { success: false, error: "Job not found" };

  revalidatePath(`/admin/jobs/${jobId}/form`);
  return { success: true };
}
