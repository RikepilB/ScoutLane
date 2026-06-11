import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { LOCAL_RESUME_STORAGE_DIR } from "@/lib/storage/upload";

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export interface StoredResume {
  buffer: Buffer;
  contentType: string;
  filename: string;
  size: number;
}

/**
 * Resolves a stored object name to an absolute path inside the local resume
 * directory, rejecting path-traversal attempts. Returns null when the
 * resolved path would escape the storage root.
 */
export function resolveLocalResumePath(objectName: string): string | null {
  const root = path.resolve(LOCAL_RESUME_STORAGE_DIR);
  const filePath = path.resolve(root, ...objectName.split("/"));
  return filePath === root || !filePath.startsWith(`${root}${path.sep}`) ? null : filePath;
}

function inferContentTypeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  return EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Loads a stored resume by object name: local disk first (dev), then the
 * database-backed ResumeFile table (Vercel/production). Returns null when the
 * object cannot be found in either backend. Throws on path-traversal input.
 */
export async function readResumeObject(objectName: string): Promise<StoredResume | null> {
  const filePath = resolveLocalResumePath(objectName);
  if (!filePath) {
    throw new Error("Invalid resume path.");
  }

  const fallbackFilename = objectName.split("/").pop() || "resume.pdf";

  try {
    const buffer = await readFile(filePath);
    return {
      buffer,
      contentType: inferContentTypeFromName(filePath),
      filename: fallbackFilename,
      size: buffer.byteLength,
    };
  } catch {
    const stored = await prisma.resumeFile.findUnique({
      where: { objectName },
      select: { contentType: true, data: true, filename: true, size: true },
    });

    if (!stored) {
      return null;
    }

    return {
      buffer: Buffer.from(stored.data),
      contentType: stored.contentType || inferContentTypeFromName(stored.filename),
      filename: stored.filename || fallbackFilename,
      size: stored.size,
    };
  }
}

/**
 * Builds a Content-Disposition header value with an RFC 5987-encoded filename
 * so non-ASCII applicant filenames survive the round trip.
 */
export function buildContentDisposition(kind: "inline" | "attachment", filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${kind}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
