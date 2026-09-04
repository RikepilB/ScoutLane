"use server";

export async function moveApplicant(applicantId: string, newStageId: string) {
  const { moveApplicantImpl } = await import("./update-impl");
  return moveApplicantImpl(applicantId, newStageId);
}

export async function bulkMoveApplicants(applicantIds: string[], newStageId: string, jobId: string) {
  const { bulkMoveApplicantsImpl } = await import("./update-impl");
  return bulkMoveApplicantsImpl(applicantIds, newStageId, jobId);
}
