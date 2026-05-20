"use server";

import type { ApplicationActionResult } from "@/schemas/application";

export async function submitJobApplication(formData: FormData): Promise<ApplicationActionResult> {
  try {
    const { submitJobApplicationImpl } = await import("./submit-job-application-impl");
    return await submitJobApplicationImpl(formData);
  } catch (error) {
    console.error("[submit] application failed:", error);
    return {
      success: false,
      error: "Could not submit your application. Please try again or contact the hiring team.",
    };
  }
}
