"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export async function moveApplicant(applicantId: string, newStatus: string) {
  const valid = z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]).safeParse(newStatus);
  if (!valid.success) return { success: false, error: "Invalid status" };

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: valid.data },
  });

  revalidatePath("/admin/jobs/[id]/pipeline");
  return { success: true };
}
