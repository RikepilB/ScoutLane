import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendCustomEmail } from "@/lib/email/send";
import { sanitizeEmailHtml } from "@/lib/email/sanitize";
import { requireSession } from "@/server/services/_lib/validate-session";

const ALLOWED_ROLES: ReadonlyArray<string> = ["ADMIN", "RECRUITER", "HIRING_MANAGER"];

const inputSchema = z.object({
  applicantId: z.string().min(1),
  subject: z
    .string()
    .trim()
    .min(2, "Subject is required")
    .max(200, "Subject must be 200 characters or fewer"),
  bodyHtml: z
    .string()
    .trim()
    .min(2, "Message body is required")
    .max(20000, "Message body is too long"),
});

export interface SendApplicantEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendApplicantEmailImpl(input: {
  applicantId: string;
  subject: string;
  bodyHtml: string;
}): Promise<SendApplicantEmailResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await requireSession();
  if (!ALLOWED_ROLES.includes(user.role)) {
    return { ok: false, error: "You do not have permission to send emails" };
  }
  const applicant = await prisma.applicant.findUnique({
    where: { id: parsed.data.applicantId },
    select: {
      id: true,
      email: true,
      jobId: true,
      job: { select: { organizationId: true } },
    },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    return { ok: false, error: "Applicant not found" };
  }
  if (!applicant.email) {
    return { ok: false, error: "Applicant has no email on file" };
  }

  const sanitizedBody = sanitizeEmailHtml(parsed.data.bodyHtml);
  if (!sanitizedBody.trim()) {
    return { ok: false, error: "Message body is empty after sanitization" };
  }

  const result = await sendCustomEmail({
    to: applicant.email,
    subject: parsed.data.subject,
    bodyHtml: sanitizedBody,
    organizationId: applicant.job.organizationId,
  });

  if (result.skipped) {
    return {
      ok: false,
      skipped: true,
      error: "Email service is not configured (RESEND_API_KEY missing). Logged as skipped.",
    };
  }

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/admin/jobs/${applicant.jobId}/applicants/${applicant.id}`);
  return { ok: true };
}
