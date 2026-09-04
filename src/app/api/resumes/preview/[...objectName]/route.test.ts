// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthorize, mockReadResumeObject, mockConvertDocx } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockReadResumeObject: vi.fn(),
  mockConvertDocx: vi.fn(),
}));

vi.mock("@/lib/resume/access", () => ({ authorizeResumeRequest: mockAuthorize }));
vi.mock("@/lib/resume/storage-read", () => ({ readResumeObject: mockReadResumeObject }));
vi.mock("@/lib/resume/docx-preview", () => ({ convertDocxToSafeHtml: mockConvertDocx }));

import { GET } from "./route";

function call(objectName: string[]) {
  return GET(new Request(`http://x/${objectName.join("/")}`) as never, {
    params: Promise.resolve({ objectName }),
  });
}

beforeEach(() => {
  mockAuthorize.mockReset();
  mockReadResumeObject.mockReset();
  mockConvertDocx.mockReset();
  mockAuthorize.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/resumes/preview/[...objectName]", () => {
  it("returns the authorizer's error status when unauthorized", async () => {
    mockAuthorize.mockResolvedValue({ ok: false, status: 401, error: "Not authenticated" });
    const res = await call(["resumes", "a.docx"]);
    expect(res.status).toBe(401);
    expect(mockReadResumeObject).not.toHaveBeenCalled();
  });

  it("returns 404 when the file isn't found", async () => {
    mockReadResumeObject.mockResolvedValue(null);
    const res = await call(["resumes", "a.docx"]);
    expect(res.status).toBe(404);
  });

  it("returns 400 when the object path is invalid", async () => {
    mockReadResumeObject.mockRejectedValue(new Error("bad path"));
    const res = await call(["resumes", "..", "a.docx"]);
    expect(res.status).toBe(400);
  });

  it("returns 415 for a non-docx file", async () => {
    mockReadResumeObject.mockResolvedValue({
      buffer: Buffer.from("%PDF-1.4"),
      contentType: "application/pdf",
      filename: "resume.pdf",
    });
    const res = await call(["resumes", "resume.pdf"]);
    expect(res.status).toBe(415);
    expect(mockConvertDocx).not.toHaveBeenCalled();
  });

  it("converts a docx to sanitized HTML with a locked-down CSP", async () => {
    mockReadResumeObject.mockResolvedValue({
      buffer: Buffer.from("PK\x03\x04fake-docx"),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: "resume.docx",
    });
    mockConvertDocx.mockResolvedValue("<p>Safe content</p>");

    const res = await call(["resumes", "resume.docx"]);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    await expect(res.text()).resolves.toBe("<p>Safe content</p>");
  });

  it("recognizes a .docx filename even with a generic content-type", async () => {
    mockReadResumeObject.mockResolvedValue({
      buffer: Buffer.from("PK\x03\x04fake-docx"),
      contentType: "application/octet-stream",
      filename: "resume.docx",
    });
    mockConvertDocx.mockResolvedValue("<p>ok</p>");

    const res = await call(["resumes", "resume.docx"]);
    expect(res.status).toBe(200);
  });

  it("returns 500 when the docx conversion throws", async () => {
    mockReadResumeObject.mockResolvedValue({
      buffer: Buffer.from("PK\x03\x04fake-docx"),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: "resume.docx",
    });
    mockConvertDocx.mockRejectedValue(new Error("corrupt file"));

    const res = await call(["resumes", "resume.docx"]);
    expect(res.status).toBe(500);
  });
});
