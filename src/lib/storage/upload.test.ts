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

afterEach(async () => {
  await rm(LOCAL_RESUME_STORAGE_DIR, { force: true, recursive: true });
});

describe("local resume storage", () => {
  it("writes local-dev uploads and serves them through the resume route", async () => {
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
});
