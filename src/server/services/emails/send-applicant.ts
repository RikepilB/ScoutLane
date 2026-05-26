"use server";

import type { SendApplicantEmailResult } from "./send-applicant-impl";

export async function sendApplicantEmail(input: {
  applicantId: string;
  subject: string;
  bodyHtml: string;
}): Promise<SendApplicantEmailResult> {
  const { sendApplicantEmailImpl } = await import("./send-applicant-impl");
  return sendApplicantEmailImpl(input);
}
