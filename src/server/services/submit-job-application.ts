"use server";

import { headers } from "next/headers";
import type { ApplicationActionResult } from "@/schemas/application";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

// ~10 application submissions per minute per IP for the multipart apply form.
const submissionRateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function submitJobApplication(formData: FormData): Promise<ApplicationActionResult> {
  try {
    const ip = clientIpFromHeaders(await headers());
    if (!submissionRateLimiter.check(ip).allowed) {
      return {
        success: false,
        error: "Too many requests. Please wait a moment and try again.",
      };
    }
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
