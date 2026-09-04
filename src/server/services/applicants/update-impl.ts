import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

const applicantStatusSchema = z.enum([
  "NEW",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
]);

export async function updateApplicantStatusImpl(applicantId: string, status: string) {
  const user = await requireSession();
  const validStatus = applicantStatusSchema.parse(status);

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: validStatus },
  });
  revalidatePath("/admin/jobs/[id]/applicants/[applicantId]");
}

export async function updateApplicantNotesImpl(applicantId: string, notes: string) {
  const user = await requireSession();

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { notes },
  });
  revalidatePath("/admin/jobs/[id]/applicants/[applicantId]");
}

export async function saveApplicantResumeDataJsonImpl(applicantId: string, jsonText: string) {
  const user = await requireSession();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON must be an object");
  }

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { jobId: true, data: true, job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  const prev = (applicant.data && typeof applicant.data === "object" ? applicant.data : {}) as Record<
    string,
    unknown
  >;
  const next = { ...prev, ...(parsed as Record<string, unknown>) };

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { data: next as Prisma.InputJsonValue },
  });

  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants/${applicantId}`);
}

export async function updateInterviewDateImpl(applicantId: string, interviewDate: string | null) {
  const user = await requireSession();

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { jobId: true, job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { interviewDate: interviewDate ? new Date(interviewDate) : null },
  });

  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants/${applicantId}`);
}

const MAX_TAG_LENGTH = 40;
const MAX_TAGS = 20;

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of tags) {
    const trimmed = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
    if (normalized.length >= MAX_TAGS) break;
  }
  return normalized;
}

export async function updateApplicantTagsImpl(applicantId: string, tags: string[]) {
  const user = await requireSession();

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { jobId: true, job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  const normalized = normalizeTags(tags);

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { tags: normalized },
  });

  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants/${applicantId}`);
  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants`);

  return normalized;
}

export async function deleteApplicantImpl(applicantId: string) {
  const user = await requireSession();

  if (user.role !== "ADMIN") {
    throw new Error("Only admins can delete applicants");
  }

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { jobId: true, job: { select: { organizationId: true } } },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    throw new Error("Applicant not found");
  }

  await prisma.applicant.delete({ where: { id: applicantId } });

  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants`);
  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants/${applicantId}`);

  return { jobId: applicant.jobId };
}
