"use server";

import type { DraftStageEmailResult } from "./draft-stage-email-impl";

export async function draftStageEmailAction(applicantId: string): Promise<DraftStageEmailResult> {
  const { draftStageEmailImpl } = await import("./draft-stage-email-impl");
  return draftStageEmailImpl(applicantId);
}
