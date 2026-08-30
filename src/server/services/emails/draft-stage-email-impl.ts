import { prisma } from "@/lib/db/prisma";
import { draftStageEmail } from "@/lib/llm/draftStageEmail";
import type { ParsedResume } from "@/lib/llm/resume";
import { requireSession } from "@/server/services/_lib/validate-session";

const ALLOWED_ROLES: ReadonlyArray<string> = ["ADMIN", "RECRUITER", "HIRING_MANAGER"];

export interface DraftStageEmailResult {
  ok: boolean;
  subject?: string;
  bodyHtml?: string;
  error?: string;
}

export async function draftStageEmailImpl(applicantId: string): Promise<DraftStageEmailResult> {
  const user = await requireSession();
  if (!ALLOWED_ROLES.includes(user.role)) {
    return { ok: false, error: "You do not have permission to draft emails" };
  }

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: {
      name: true,
      status: true,
      parsedData: true,
      job: { select: { title: true, organizationId: true } },
    },
  });
  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    return { ok: false, error: "Applicant not found" };
  }

  const draft = await draftStageEmail({
    applicantName: applicant.name,
    jobTitle: applicant.job.title,
    targetStatus: applicant.status,
    parsedResume: applicant.parsedData as unknown as ParsedResume | null,
  });

  if (!draft) {
    return { ok: false, error: "AI drafting is not configured (OPENROUTER_API_KEY missing)." };
  }

  return { ok: true, subject: draft.subject, bodyHtml: draft.bodyHtml };
}
