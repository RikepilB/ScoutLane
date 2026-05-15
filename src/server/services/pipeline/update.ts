"use server";

export async function moveApplicant(applicantId: string, newStageId: string) {
  const { moveApplicantImpl } = await import("./update-impl");
  return moveApplicantImpl(applicantId, newStageId);
}
