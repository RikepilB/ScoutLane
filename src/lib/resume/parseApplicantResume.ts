import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { extractTextFromResumeBuffer } from "@/lib/resume/extractText";
import { parseResumeFromText, type ParsedResume } from "@/lib/llm/resume";
import { scoreApplicantInline } from "@/lib/match/scoreApplicant";

function buildParsedApplicantData(existing: unknown, parsed: ParsedResume) {
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
    confidence: e.confidence,
  }));
  next.work = parsed.workHistory.map((w) => ({
    company: w.company,
    title: w.jobTitle,
    duration: w.duration,
    confidence: w.confidence,
  }));
  next.skills = parsed.skills;
  next.skillsConfidence = parsed.skillsConfidence;
  next.fullNameConfidence = parsed.fullNameConfidence;
  next.emailConfidence = parsed.emailConfidence;
  next.phoneConfidence = parsed.phoneConfidence;
  return next;
}

function getAppBaseUrl(): string {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const baseUrl = /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;
  return baseUrl.replace(/\/$/, "");
}

function resolveResumeUrl(resumeUrl: string): string {
  try {
    const parsedUrl = new URL(resumeUrl);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    // Relative URLs are resolved against the configured app origin below.
  }

  return new URL(resumeUrl, getAppBaseUrl()).toString();
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

  let rawText: string;
  let parsed: ParsedResume;
  try {
    rawText = await extractTextFromResumeBuffer(buffer, filename);
    parsed = await parseResumeFromText(rawText.slice(0, 48_000));
  } catch (error) {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { parsingStatus: "FAILED" },
    });
    throw error;
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      parsedData: parsed,
      parsingStatus: "COMPLETED",
      data: buildParsedApplicantData(existing?.data, parsed) as Prisma.InputJsonValue,
    },
  });

  try {
    await scoreApplicantInline(applicantId);
  } catch (err) {
    console.error(`[parse] match-score failed for applicant ${applicantId}`, err);
  }
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

  const response = await fetch(resolveResumeUrl(resumeUrl));
  if (!response.ok) {
    throw new Error(`Could not download resume (HTTP ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await parseApplicantResumeFromBuffer(applicantId, buffer, filenameFromUrl);
}
