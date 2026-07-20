import type { ApplicationStatus } from "@/generated/prisma/enums";

const STAGE_NAME_TO_STATUS: Record<string, ApplicationStatus> = {
  APPLIED: "NEW",
  NEW: "NEW",
  SCREENING: "REVIEWING",
  REVIEWING: "REVIEWING",
  ASSESSMENT: "REVIEWING",
  SHORTLISTED: "SHORTLISTED",
  INTERVIEW: "INTERVIEW",
  OFFER: "OFFERED",
  OFFERED: "OFFERED",
  HIRED: "OFFERED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
};

/**
 * Best-effort `ApplicationStatus` for a newly-created `PipelineStage`, derived from its
 * name. Unmapped names fall back to `REVIEWING` — same convention `moveApplicantImpl`
 * used before `PipelineStage.status` became an explicit column.
 */
export function deriveStageStatus(stageName: string): ApplicationStatus {
  return STAGE_NAME_TO_STATUS[stageName.toUpperCase()] ?? "REVIEWING";
}
