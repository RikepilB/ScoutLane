import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { extractTextFromResumeBuffer } from "@/lib/resume/extractText";
import { parseResumeWithGemini } from "@/lib/llm/resume";

function buildParsedApplicantData(
  existing: unknown,
  parsed: Awaited<ReturnType<typeof parseResumeWithGemini>>,
) {
  const prev = existing && typeof existing === "object" ? { ...(existing as Record<string, unknown>) } : {};
  const customFields = prev.customFields;
  const next: Record<string, unknown> = { ...prev };
  if (customFields !== undefined) {
    next.customFields = customFields;
  }
  next.education = parsed.education.map((e) => ({
    institution: e.institution,
    degree: e.degree,
    field: e.fieldOfStudy,
    graduationYear: e.graduationYear,
    timePeriod: e.timePeriod,
  }));
  next.work = parsed.workHistory.map((w) => ({
    company: w.company,
    title: w.jobTitle,
    duration: w.duration,
  }));
  next.skills = parsed.skills;
  return next;
}

export async function parseApplicantResumeFromBuffer(
  applicantId: string,
  buffer: Buffer,
  filename: string,
): Promise<void> {
  await prisma.applicant.update({
    where: { id: applicantId },
    data: { parsingStatus: "PARSING" },
  });

  const existing = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { data: true },
  });

  const rawText = await extractTextFromResumeBuffer(buffer, filename);
  const parsed = await parseResumeWithGemini(rawText.slice(0, 48_000));

  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      parsedData: parsed,
      parsingStatus: "COMPLETED",
      data: buildParsedApplicantData(existing?.data, parsed) as Prisma.InputJsonValue,
    },
  });
}

export async function parseApplicantResumeFromUrl(applicantId: string, resumeUrl: string): Promise<void> {
  const filenameFromUrl = (() => {
    try {
      const u = new URL(resumeUrl, "http://localhost");
      const last = u.pathname.split("/").pop();
      return last && last.includes(".") ? last : "resume.pdf";
    } catch {
      return "resume.pdf";
    }
  })();

  const response = await fetch(resumeUrl);
  if (!response.ok) {
    throw new Error(`Could not download resume (HTTP ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await parseApplicantResumeFromBuffer(applicantId, buffer, filenameFromUrl);
}
