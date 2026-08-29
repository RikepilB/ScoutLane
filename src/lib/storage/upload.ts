import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db/prisma";
import path from "node:path";
import { slugify } from "@/lib/slug";
import { isStorageConfigured, getStorageConfig, getBucket } from "./client";
import { assertResumeUploadAllowed } from "./upload-limits";

export const LOCAL_RESUME_STORAGE_DIR = path.join(process.cwd(), ".data", "resumes");

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

function isS3StorageConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_PUBLIC_BASE_URL
  );
}

function getS3PublicUrl(objectName: string): string {
  return `${process.env.S3_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${objectName}`;
}

function encodeS3Path(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function uploadS3CompatibleObject({
  buffer,
  contentType,
  filename,
  prefix,
}: Required<UploadBufferInput>): Promise<UploadedFileResult> {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET!;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;
  const region = process.env.S3_REGION || "auto";
  const objectName = buildObjectName(filename, prefix);
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = `${dateStamp}T${now.toISOString().slice(11, 19).replace(/:/g, "")}Z`;
  const url = new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodeS3Path(objectName)}`);
  const payloadHash = sha256Hex(buffer);
  const host = url.host;
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const response = await fetch(url, {
    method: "PUT",
    body: new Uint8Array(buffer),
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  });

  if (!response.ok) {
    throw new Error(`S3 resume upload failed with HTTP ${response.status}`);
  }

  return {
    bucket,
    contentType,
    objectName,
    url: getS3PublicUrl(objectName),
  };
}

function inferResumeContentType(filename: string, contentType: string): string {
  if (contentType && contentType !== "application/octet-stream") {
    return contentType;
  }

  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "csv") return "text/csv; charset=utf-8";
  return contentType || "application/octet-stream";
}

async function uploadDatabaseResumeObject({
  buffer,
  contentType,
  filename,
  prefix,
}: Required<UploadBufferInput>): Promise<UploadedFileResult> {
  const objectName = buildObjectName(filename, prefix);
  await prisma.resumeFile.create({
    data: {
      objectName,
      filename,
      contentType,
      size: buffer.byteLength,
      data: Uint8Array.from(buffer),
    },
  });

  return {
    bucket: "database",
    contentType,
    objectName,
    url: `/api/resumes/${objectName}`,
  };
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
  const resolvedContentType = inferResumeContentType(filename, contentType);

  if (!isStorageConfigured() && isS3StorageConfigured()) {
    return uploadS3CompatibleObject({
      buffer,
      contentType: resolvedContentType,
      filename,
      prefix,
    });
  }

  if (!isStorageConfigured()) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return uploadDatabaseResumeObject({
        buffer,
        contentType: resolvedContentType,
        filename,
        prefix,
      });
    }

    const objectName = buildObjectName(filename, prefix);
    const filePath = path.join(LOCAL_RESUME_STORAGE_DIR, objectName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return {
      bucket: "local-dev",
      contentType: resolvedContentType,
      objectName,
      url: `/api/resumes/${objectName}`,
    };
  }

  const config = getStorageConfig();
  const objectName = buildObjectName(filename, prefix);
  const file = getBucket().file(objectName);

  await file.save(buffer, {
    resumable: false,
    contentType: resolvedContentType,
    metadata: {
      cacheControl: "private, max-age=0, no-cache",
    },
  });

  return {
    bucket: config.GCS_BUCKET,
    contentType: resolvedContentType,
    objectName,
    url: getPublicUrl(objectName),
  };
}

export async function uploadResumeFile(file: File): Promise<UploadedFileResult> {
  const filename = file.name || "resume.pdf";
  const buffer = Buffer.from(await file.arrayBuffer());

  // Defense-in-depth: re-assert the request-boundary limits (size, type, and
  // content magic) so any caller of this storage entrypoint cannot bypass them.
  assertResumeUploadAllowed({ size: file.size, mime: file.type, filename, head: buffer });

  return uploadFileBuffer({
    buffer,
    contentType: file.type || "application/octet-stream",
    filename,
  });
}
