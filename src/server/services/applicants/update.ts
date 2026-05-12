"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function updateApplicantStatus(applicantId: string, status: string) {
  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: status as any },
  });
  revalidatePath("/admin/jobs/[id]/applicants/[applicantId]");
}

export async function updateApplicantNotes(applicantId: string, notes: string) {
  await prisma.applicant.update({
    where: { id: applicantId },
    data: { notes },
  });
  revalidatePath("/admin/jobs/[id]/applicants/[applicantId]");
}
