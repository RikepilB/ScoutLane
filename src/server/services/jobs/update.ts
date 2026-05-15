"use server";

import type { UpdateJobInput } from "@/schemas/job";

export async function updateJob(id: string, data: UpdateJobInput) {
  const { updateJobImpl } = await import("./update-impl");
  return updateJobImpl(id, data);
}

export async function saveCustomFields(jobId: string, customFields: unknown[]) {
  const { saveCustomFieldsImpl } = await import("./update-impl");
  return saveCustomFieldsImpl(jobId, customFields);
}
