"use server";

export async function createApplicantNote(applicantId: string, body: string) {
  const { createApplicantNoteImpl } = await import("./notes-impl");
  return createApplicantNoteImpl(applicantId, body);
}

export async function updateApplicantNote(noteId: string, body: string) {
  const { updateApplicantNoteImpl } = await import("./notes-impl");
  return updateApplicantNoteImpl(noteId, body);
}

export async function deleteApplicantNote(noteId: string) {
  const { deleteApplicantNoteImpl } = await import("./notes-impl");
  return deleteApplicantNoteImpl(noteId);
}
