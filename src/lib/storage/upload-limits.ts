/**
 * Single source of truth for resume upload constraints.
 *
 * The public application schema (`src/schemas/application.ts`) validates uploads
 * at the request boundary; the storage layer (`upload.ts`) re-asserts the same
 * limits as defense-in-depth so any future caller of `uploadResumeFile` cannot
 * bypass the size/type guard.
 */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RESUME_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
] as const;

export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx", ".csv", ".txt"] as const;

export function hasAllowedResumeExtension(filename: string): boolean {
  const normalized = filename.toLowerCase();
  return ALLOWED_RESUME_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function isAllowedResumeMime(mime: string): boolean {
  return ALLOWED_RESUME_MIME.includes(mime as (typeof ALLOWED_RESUME_MIME)[number]);
}

export interface ResumeUploadCandidate {
  size: number;
  mime: string;
  filename: string;
}

/**
 * Throws when a resume upload violates the size cap or is neither an allowed
 * MIME type nor an allowed extension. Mirrors the request-boundary rules so the
 * storage layer is safe to call directly.
 */
export function assertResumeUploadAllowed({ size, mime, filename }: ResumeUploadCandidate): void {
  if (size <= 0) {
    throw new Error("Resume file is empty.");
  }
  if (size > MAX_RESUME_BYTES) {
    throw new Error(
      `Resume too large (${size} bytes; max ${MAX_RESUME_BYTES} bytes / 5 MB).`,
    );
  }
  if (!isAllowedResumeMime(mime) && !hasAllowedResumeExtension(filename)) {
    throw new Error(`Unsupported resume file type: ${mime || "unknown"} (${filename}).`);
  }
}
