"use server";

import type { JobActionResult } from "@/schemas/job";

export async function createJob(formData: FormData): Promise<JobActionResult> {
  const { createJobImpl } = await import("./create-impl");
  return createJobImpl(formData);
}
