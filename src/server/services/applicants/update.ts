"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/server/services/_lib/validate-session";

const applicantStatusSchema = z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]);

export async function updateApplicantStatus(applicantId: string, status: string) {
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

export async function updateApplicantNotes(applicantId: string, notes: string) {
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
