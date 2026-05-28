import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { extractTextFromResumeBuffer } from "@/lib/resume/extractText";
import { parseResumeFromText, type ParsedResume } from "@/lib/llm/resume";
import { scoreApplicantInline } from "@/lib/match/scoreApplicant";
import { LOCAL_RESUME_STORAGE_DIR } from "@/lib/storage/upload";

const MAX_PARSING_ERROR_LENGTH = 240;
const PARSING_SECRET_PATTERNS: ReadonlyArray<RegExp> = [
  /sk-[A-Za-z0-9_-]{16,}/g,
  /re_[A-Za-z0-9_-]{16,}/g,
  /Bearer\s+[A-Za-z0-9._-]{16,}/gi,
  /(api[_-]?key|token|secret|password)[\s:=]+[A-Za-z0-9._-]{8,}/gi,
];

function sanitizeParsingError(value: string): string {
  let scrubbed = value;
  for (const pattern of PARSING_SECRET_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, "[REDACTED]");
  }
  if (scrubbed.length > MAX_PARSING_ERROR_LENGTH) {
    scrubbed = `${scrubbed.slice(0, MAX_PARSING_ERROR_LENGTH)}… [truncated]`;
  }
  return scrubbed;
}

function buildFailureData(existing: unknown, errorMessage: string) {
  const prev = existing && typeof existing === "object" ? { ...(existing as Record<string, unknown>) } : {};
  return {
    ...prev,
    parsingError: sanitizeParsingError(errorMessage),
    parsingFailedAt: new Date().toISOString(),
  };
}

function buildParsedApplicantData(existing: unknown, parsed: ParsedResume) {
  const prev = existing && typeof existing === "object" ? { ...(existing as Record<string, unknown>) } : {};
  const customFields = prev.customFields;
  const next: Record<string, unknown> = { ...prev };
  delete next.parsingError;
  delete next.parsingFailedAt;
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

function getResumeObjectName(resumeUrl: string): string | null {
  const pathname = (() => {
    try {
      return new URL(resumeUrl, getAppBaseUrl()).pathname;
    } catch {
      return resumeUrl;
    }
  })();
  const prefix = "/api/resumes/";
  if (!pathname.startsWith(prefix)) return null;

  const objectName = pathname.slice(prefix.length);
  return objectName.length > 0
    ? objectName
        .split("/")
        .map((segment) => decodeURIComponent(segment))
        .join("/")
    : null;
}

function resolveLocalResumePath(objectName: string): string | null {
  const root = path.resolve(LOCAL_RESUME_STORAGE_DIR);
  const filePath = path.resolve(root, ...objectName.split("/"));
  return filePath === root || !filePath.startsWith(`${root}${path.sep}`) ? null : filePath;
}

async function readStoredResume(
  resumeUrl: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
  const objectName = getResumeObjectName(resumeUrl);
  if (!objectName) return null;

  const filePath = resolveLocalResumePath(objectName);
  if (!filePath) {
    throw new Error("Invalid resume path.");
  }

  const filename = objectName.split("/").pop() || "resume.pdf";
  try {
    return { buffer: await readFile(filePath), filename };
  } catch {
    const stored = await prisma.resumeFile.findUnique({
      where: { objectName },
      select: { data: true },
    });
    if (!stored) {
      throw new Error("Could not load stored resume.");
    }
    return { buffer: Buffer.from(stored.data), filename };
  }
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
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Empty or unreadable resume — could not extract any text");
    }
    parsed = await parseResumeFromText(rawText.slice(0, 48_000));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[parse] failed for applicant ${applicantId}:`, error);
    const failureData = buildFailureData(existing?.data, errorMessage);
    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        parsingStatus: "FAILED",
        data: failureData as Prisma.InputJsonValue,
      },
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

export async function parseApplicantResumeFromUrl(
  applicantId: string,
  resumeUrl: string,
): Promise<void> {
  const storedResume = await readStoredResume(resumeUrl);
  if (storedResume) {
    await parseApplicantResumeFromBuffer(applicantId, storedResume.buffer, storedResume.filename);
    return;
  }

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
