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
  /** Optional first bytes of the file for magic-byte validation. */
  head?: Uint8Array;
}

const PDF_MAGIC = "%PDF-";
const DOCX_MAGIC = "PK";
const OLE2_MAGIC = [0xd0, 0xcf, 0x11, 0xe0];

const HEAD_LENGTH = 8;

function startsWithAscii(bytes: Uint8Array, prefix: string): boolean {
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] === undefined || bytes[i] !== prefix.charCodeAt(i)) return false;
  }
  return true;
}

function startsWithBytes(bytes: Uint8Array, magic: Array<number>): boolean {
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] === undefined || bytes[i] !== magic[i]) return false;
  }
  return true;
}

/**
 * Content sniffing: if the image/type is a known binary format, the actual
 * bytes must match it. Text formats (txt/csv) and unknown heads are accepted —
 * the primary defense is still the MIME/extension allowlist.
 */
export function sniffResumeMagic(head: Uint8Array | undefined, extension: string): boolean {
  if (!head || head.byteLength === 0) return true;
  if (extension === ".pdf") return startsWithAscii(head, PDF_MAGIC);
  if (extension === ".docx") return startsWithAscii(head, DOCX_MAGIC);
  if (extension === ".doc") return startsWithBytes(head, OLE2_MAGIC);
  return true;
}

/**
 * Throws when a resume upload violates the size cap or is neither an allowed
 * MIME type nor an allowed extension. Mirrors the request-boundary rules so the
 * storage layer is safe to call directly.
 */
export function assertResumeUploadAllowed({ size, mime, filename, head }: ResumeUploadCandidate): void {
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
  const normalized = filename.toLowerCase();
  const extension = ALLOWED_RESUME_EXTENSIONS.find((ext) => normalized.endsWith(ext)) ?? "";
  if (!sniffResumeMagic(head, extension)) {
    throw new Error(
      `File content does not match its declared type (${mime || "unknown"} / ${extension || filename}).`,
    );
  }
}
