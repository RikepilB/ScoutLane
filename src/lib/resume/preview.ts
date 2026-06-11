/**
 * Decides whether a stored resume can be shown in an inline browser preview
 * (an `<iframe>`), based on its stored MIME content type and, as a fallback,
 * its filename/URL extension.
 *
 * PDFs and plain-text formats render natively in the browser; Word documents
 * (.doc/.docx) cannot be previewed inline and must be downloaded.
 *
 * The MIME type is the source of truth because stored resume URLs often have no
 * usable extension (e.g. `/api/resumes/<id>` or a signed object URL). The
 * extension is only consulted when the content type is unknown.
 */

const EMBEDDABLE_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "text/csv",
  "text/plain",
]);

const EMBEDDABLE_EXTENSIONS = /\.(pdf|csv|txt)$/i;

const DOCX_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const DOCX_EXTENSION = /\.docx$/i;

export type ResumePreviewKind = "native" | "docx-html" | "none";

/**
 * Decides how the admin UI previews a resume: `native` renders the original
 * file in an iframe (PDF/text), `docx-html` renders the server-converted HTML
 * preview route, `none` falls back to download-only.
 */
export function getResumePreviewKind(input: {
  contentType?: string | null;
  pathname?: string | null;
}): ResumePreviewKind {
  if (canEmbedResume(input)) {
    return "native";
  }
  const contentType = input.contentType?.split(";")[0]?.trim().toLowerCase();
  if (contentType && DOCX_CONTENT_TYPES.has(contentType)) {
    return "docx-html";
  }
  if (!contentType && input.pathname && DOCX_EXTENSION.test(input.pathname)) {
    return "docx-html";
  }
  return "none";
}

export function canEmbedResume(input: {
  contentType?: string | null;
  pathname?: string | null;
}): boolean {
  const contentType = input.contentType?.split(";")[0]?.trim().toLowerCase();
  if (contentType) {
    return EMBEDDABLE_CONTENT_TYPES.has(contentType);
  }
  if (input.pathname) {
    return EMBEDDABLE_EXTENSIONS.test(input.pathname);
  }
  return false;
}
