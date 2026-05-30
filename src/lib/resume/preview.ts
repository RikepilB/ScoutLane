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
