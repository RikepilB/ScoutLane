import type { Prisma } from "@/generated/prisma/client";

export type ApplicantDetail = Prisma.ApplicantGetPayload<{
  include: {
    job: { select: { title: true; slug: true; customFields: true } };
    pipelineStage: { select: { id: true; name: true } };
    noteEntries: {
      orderBy: { createdAt: "desc" };
      include: { author: { select: { name: true } } };
    };
    transitions: {
      orderBy: { createdAt: "desc" };
      include: { changedBy: { select: { name: true } } };
    };
  };
}>;

export function matchBadgeColor(score: number | null): string {
  if (score === null) return "bg-paper-2 text-steel";
  if (score >= 0.75) return "bg-success-soft text-success";
  if (score >= 0.5) return "bg-warning-soft text-warning";
  if (score >= 0.3) return "bg-paper-2 text-ink-700";
  return "bg-danger-soft text-danger";
}

export function getAppBaseUrl(): string {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const baseUrl = /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;
  return baseUrl.replace(/\/$/, "");
}

export function getResumePathname(resumeUrl: string): string {
  try {
    return new URL(resumeUrl, getAppBaseUrl()).pathname;
  } catch {
    return resumeUrl;
  }
}

/**
 * Extracts the stored object name from a locally-served resume URL
 * (`/api/resumes/<objectName>`) so we can look up its content type. Returns
 * null for externally-hosted URLs (e.g. signed GCS object URLs).
 */
export function getResumeObjectName(resumeUrl: string): string | null {
  const pathname = getResumePathname(resumeUrl);
  const prefix = "/api/resumes/";
  if (!pathname.startsWith(prefix)) return null;
  const objectName = pathname.slice(prefix.length);
  if (!objectName) return null;
  return objectName
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}
