import { randomUUID } from "node:crypto";
import { slugify } from "@/lib/slug";
import { getStorageConfig, getBucket } from "./client";

function buildObjectName(filename: string, prefix: string): string {
  const cleanName = slugify(filename.replace(/\.[^.]+$/, "")) || "resume";
  const extension = filename.includes(".") ? filename.split(".").pop() : "pdf";
  const month = new Date().toISOString().slice(0, 7);
  return `${prefix}/${month}/${cleanName}-${randomUUID()}.${extension}`;
}

function getPublicUrl(objectName: string): string {
  const config = getStorageConfig();

  if (config.GCS_PUBLIC_BASE_URL) {
    return `${config.GCS_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectName}`;
  }

  return `https://storage.googleapis.com/${config.GCS_BUCKET}/${objectName}`;
}

export interface UploadBufferInput {
  buffer: Buffer;
  contentType: string;
  filename: string;
  prefix?: string;
}

export interface UploadedFileResult {
  bucket: string;
  contentType: string;
  objectName: string;
  url: string;
}

export async function uploadFileBuffer({
  buffer,
  contentType,
  filename,
  prefix = "resumes",
}: UploadBufferInput): Promise<UploadedFileResult> {
  const config = getStorageConfig();
  const objectName = buildObjectName(filename, prefix);
  const file = getBucket().file(objectName);

  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "private, max-age=0, no-cache",
    },
  });

  return {
    bucket: config.GCS_BUCKET,
    contentType,
    objectName,
    url: getPublicUrl(objectName),
  };
}

export async function uploadResumeFile(file: File): Promise<UploadedFileResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return uploadFileBuffer({
    buffer,
    contentType: file.type || "application/octet-stream",
    filename: file.name || "resume.pdf",
  });
}
