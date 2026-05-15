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
