import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { z } from "zod";
import { slugify } from "@/lib/slug";

const storageEnvSchema = z.object({
  GCS_BUCKET: z.string().min(1),
  GCS_CLIENT_EMAIL: z.string().min(1),
  GCS_PRIVATE_KEY: z.string().min(1),
  GCS_PROJECT_ID: z.string().min(1),
  GCS_PUBLIC_BASE_URL: z.string().url().optional(),
});

let cachedStorage: Storage | null = null;

function getStorageConfig() {
  return storageEnvSchema.parse({
    GCS_BUCKET: process.env.GCS_BUCKET,
    GCS_CLIENT_EMAIL: process.env.GCS_CLIENT_EMAIL,
    GCS_PRIVATE_KEY: process.env.GCS_PRIVATE_KEY,
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
    GCS_PUBLIC_BASE_URL: process.env.GCS_PUBLIC_BASE_URL || undefined,
  });
}

function getStorageClient(): Storage {
  if (cachedStorage) {
    return cachedStorage;
  }

  const config = getStorageConfig();

  cachedStorage = new Storage({
    projectId: config.GCS_PROJECT_ID,
    credentials: {
      client_email: config.GCS_CLIENT_EMAIL,
      private_key: config.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
  });

  return cachedStorage;
}

function getBucket() {
  return getStorageClient().bucket(getStorageConfig().GCS_BUCKET);
}

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
