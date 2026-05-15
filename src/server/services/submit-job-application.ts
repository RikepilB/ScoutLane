"use server";

import type { ApplicationActionResult } from "@/schemas/application";

export async function submitJobApplication(formData: FormData): Promise<ApplicationActionResult> {
  const { submitJobApplicationImpl } = await import("./submit-job-application-impl");
  return submitJobApplicationImpl(formData);
}
