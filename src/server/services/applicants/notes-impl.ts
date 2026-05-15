import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

export async function createApplicantNoteImpl(applicantId: string, body: string) {
  const user = await requireSession();
  const text = body.trim();
  if (!text) throw new Error("Note cannot be empty");

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { jobId: true, job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  await prisma.applicantNote.create({
    data: { applicantId, authorId: user.id, body: text },
  });

  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants/${applicantId}`);
}

export async function updateApplicantNoteImpl(noteId: string, body: string) {
  const user = await requireSession();
  const text = body.trim();
  if (!text) throw new Error("Note cannot be empty");

  const note = await prisma.applicantNote.findUnique({
    where: { id: noteId },
    include: { applicant: { select: { jobId: true, job: { select: { organizationId: true } } } } },
  });
  if (!note || note.applicant.job.organizationId !== user.organizationId) {
    throw new Error("Note not found");
  }

  await prisma.applicantNote.update({
    where: { id: noteId },
    data: { body: text },
  });

  revalidatePath(`/admin/jobs/${note.applicant.jobId}/applicants/${note.applicantId}`);
}

export async function deleteApplicantNoteImpl(noteId: string) {
  const user = await requireSession();

  const note = await prisma.applicantNote.findUnique({
    where: { id: noteId },
    include: { applicant: { select: { jobId: true, job: { select: { organizationId: true } } } } },
  });
  if (!note || note.applicant.job.organizationId !== user.organizationId) {
    throw new Error("Note not found");
  }

  const applicantId = note.applicantId;
  const jobId = note.applicant.jobId;

  await prisma.applicantNote.delete({ where: { id: noteId } });

  revalidatePath(`/admin/jobs/${jobId}/applicants/${applicantId}`);
}
