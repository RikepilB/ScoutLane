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

export async function updateInterviewDate(applicantId: string, interviewDate: string | null) {
  const { updateInterviewDateImpl } = await import("./update-impl");
  return updateInterviewDateImpl(applicantId, interviewDate);
}

export async function deleteApplicant(applicantId: string) {
  const { deleteApplicantImpl } = await import("./update-impl");
  return deleteApplicantImpl(applicantId);
}
