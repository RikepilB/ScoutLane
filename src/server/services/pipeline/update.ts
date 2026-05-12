"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { dispatchWebhook } from "@/lib/webhook";
import { z } from "zod";

export async function moveApplicant(applicantId: string, newStatus: string) {
  const valid = z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]).safeParse(newStatus);
  if (!valid.success) return { success: false, error: "Invalid status" };

  const applicant = await prisma.applicant.update({
    where: { id: applicantId },
    data: { status: valid.data },
    include: { job: { select: { title: true } } },
  });

  const webhooks = await prisma.webhook.findMany({
    where: {
      active: true,
      events: { has: "applicant.status_changed" },
    },
  });

  for (const webhook of webhooks) {
    dispatchWebhook(webhook.id, "applicant.status_changed", {
      applicantId: applicant.id,
      name: applicant.name,
      email: applicant.email,
      status: valid.data,
      jobTitle: applicant.job.title,
    }).catch(() => {});
  }

  revalidatePath("/admin/jobs/[id]/pipeline");
  return { success: true };
}
