// @vitest-environment node
import { rm } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/resumes/[...objectName]/route";
import { LOCAL_RESUME_STORAGE_DIR, uploadFileBuffer } from "./upload";

vi.mock("./client", () => ({
  getBucket: vi.fn(),
  getStorageConfig: vi.fn(),
  isStorageConfigured: () => false,
}));

const { resumeFileCreate, resumeFileFindUnique } = vi.hoisted(() => ({
  resumeFileCreate: vi.fn(),
  resumeFileFindUnique: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    resumeFile: {
      create: resumeFileCreate,
      findUnique: resumeFileFindUnique,
    },
  },
}));

const originalVercel = process.env.VERCEL;
const originalS3 = {
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
  S3_REGION: process.env.S3_REGION,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
};

function clearS3Env() {
  delete process.env.S3_ACCESS_KEY_ID;
  delete process.env.S3_BUCKET;
  delete process.env.S3_ENDPOINT;
  delete process.env.S3_PUBLIC_BASE_URL;
  delete process.env.S3_REGION;
  delete process.env.S3_SECRET_ACCESS_KEY;
}

function restoreS3Env() {
  for (const [key, value] of Object.entries(originalS3)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(async () => {
  if (originalVercel === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = originalVercel;
  }
  restoreS3Env();
  resumeFileCreate.mockReset();
  resumeFileFindUnique.mockReset();
  await rm(LOCAL_RESUME_STORAGE_DIR, { force: true, recursive: true });
});

describe("local resume storage", () => {
  it("writes local-dev uploads and serves them through the resume route", async () => {
    clearS3Env();

    const upload = await uploadFileBuffer({
      buffer: Buffer.from("resume text"),
      contentType: "application/pdf",
      filename: "Jane Resume.pdf",
    });

    expect(upload.bucket).toBe("local-dev");
    expect(upload.url).toBe(`/api/resumes/${upload.objectName}`);
    expect(upload.objectName).toMatch(/^resumes\/\d{4}-\d{2}\/jane-resume-/);

    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ objectName: upload.objectName.split("/") }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(await response.text()).toBe("resume text");
  });

  it("rejects path traversal attempts", async () => {
    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ objectName: ["..", "secret.pdf"] }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 for missing local resumes", async () => {
    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ objectName: ["resumes", "missing.pdf"] }),
    });

    expect(response.status).toBe(404);
  });

  it("uses database-backed storage on Vercel when object storage is not configured", async () => {
    clearS3Env();
    process.env.VERCEL = "1";
    resumeFileCreate.mockResolvedValue({});

    const upload = await uploadFileBuffer({
      buffer: Buffer.from("resume text"),
      contentType: "application/pdf",
      filename: "Jane Resume.pdf",
    });

    expect(upload.bucket).toBe("database");
    expect(upload.url).toBe(`/api/resumes/${upload.objectName}`);
    expect(resumeFileCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contentType: "application/pdf",
        filename: "Jane Resume.pdf",
        size: 11,
      }),
    });
  });

  it("serves database-backed resumes when no local file exists", async () => {
    resumeFileFindUnique.mockResolvedValue({
      contentType: "text/csv; charset=utf-8",
      data: Buffer.from("name,skills\nJane,TypeScript"),
      size: 28,
    });

    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ objectName: ["resumes", "db-resume.csv"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(await response.text()).toBe("name,skills\nJane,TypeScript");
  });

  it("uploads through S3-compatible storage when configured", async () => {
    process.env.S3_ACCESS_KEY_ID = "test-key";
    process.env.S3_BUCKET = "resume-bucket";
    process.env.S3_ENDPOINT = "https://storage.example.test";
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.test/resumes";
    process.env.S3_REGION = "us-east-1";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const upload = await uploadFileBuffer({
      buffer: Buffer.from("name,skills\nJane,TypeScript"),
      contentType: "application/octet-stream",
      filename: "Jane Resume.csv",
    });

    expect(upload.bucket).toBe("resume-bucket");
    expect(upload.contentType).toBe("text/csv; charset=utf-8");
    expect(upload.url).toBe(`https://cdn.example.test/resumes/${upload.objectName}`);
    expect(upload.objectName).toMatch(/^resumes\/\d{4}-\d{2}\/jane-resume-/);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: "storage.example.test" }),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("AWS4-HMAC-SHA256"),
          "Content-Type": "text/csv; charset=utf-8",
        }),
      }),
    );
  });
});
