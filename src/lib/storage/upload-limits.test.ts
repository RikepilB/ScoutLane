import { describe, expect, it } from "vitest";
import {
  ALLOWED_RESUME_MIME,
  MAX_RESUME_BYTES,
  assertResumeUploadAllowed,
  hasAllowedResumeExtension,
  isAllowedResumeMime,
} from "./upload-limits";

describe("assertResumeUploadAllowed", () => {
  it("accepts a PDF under the size cap", () => {
    expect(() =>
      assertResumeUploadAllowed({ size: 100_000, mime: "application/pdf", filename: "r.pdf" }),
    ).not.toThrow();
  });

  it("accepts a DOCX by extension when the MIME is generic octet-stream", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: 100_000,
        mime: "application/octet-stream",
        filename: "resume.docx",
      }),
    ).not.toThrow();
  });

  it("rejects an empty file", () => {
    expect(() =>
      assertResumeUploadAllowed({ size: 0, mime: "application/pdf", filename: "r.pdf" }),
    ).toThrow(/empty/i);
  });

  it("rejects files larger than MAX_RESUME_BYTES", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: MAX_RESUME_BYTES + 1,
        mime: "application/pdf",
        filename: "r.pdf",
      }),
    ).toThrow(/too large/i);
  });

  it("rejects unknown MIME types with disallowed extensions", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: 1000,
        mime: "application/x-msdownload",
        filename: "r.exe",
      }),
    ).toThrow(/unsupported/i);
  });
});

describe("resume allowlists", () => {
  it("allowlist includes pdf, doc, docx", () => {
    expect(ALLOWED_RESUME_MIME).toEqual(
      expect.arrayContaining([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
    );
  });

  it("isAllowedResumeMime is case-sensitive exact match", () => {
    expect(isAllowedResumeMime("application/pdf")).toBe(true);
    expect(isAllowedResumeMime("application/zip")).toBe(false);
  });

  it("hasAllowedResumeExtension matches case-insensitively", () => {
    expect(hasAllowedResumeExtension("Resume.PDF")).toBe(true);
    expect(hasAllowedResumeExtension("resume.exe")).toBe(false);
  });
});
