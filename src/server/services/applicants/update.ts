"use server";

export async function updateApplicantStatus(applicantId: string, status: string) {
  const { updateApplicantStatusImpl } = await import("./update-impl");
  return updateApplicantStatusImpl(applicantId, status);
}

export async function updateApplicantNotes(applicantId: string, notes: string) {
  const { updateApplicantNotesImpl } = await import("./update-impl");
  return updateApplicantNotesImpl(applicantId, notes);
}

export async function saveApplicantResumeDataJson(applicantId: string, jsonText: string) {
  const { saveApplicantResumeDataJsonImpl } = await import("./update-impl");
  return saveApplicantResumeDataJsonImpl(applicantId, jsonText);
}
