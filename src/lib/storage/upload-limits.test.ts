import { describe, expect, it } from "vitest";
import {
  ALLOWED_RESUME_MIME,
  MAX_RESUME_BYTES,
  assertResumeUploadAllowed,
  hasAllowedResumeExtension,
  isAllowedResumeMime,
  sniffResumeMagic,
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

  it("rejects a PDF whose content is not a PDF", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: 1000,
        mime: "application/pdf",
        filename: "r.pdf",
        head: new TextEncoder().encode("MZ\x90\x00" + "not a pdf"),
      }),
    ).toThrow(/content does not match/i);
  });

  it("rejects a DOCX whose content is not a ZIP", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: 1000,
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "r.docx",
        head: new TextEncoder().encode("%PDF-1.7 forged"),
      }),
    ).toThrow(/content does not match/i);
  });

  it("accepts an OLE2 legacy .doc", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: 1000,
        mime: "application/msword",
        filename: "r.doc",
        head: new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      }),
    ).not.toThrow();
  });

  it("accepts text formats without requiring magic", () => {
    expect(() =>
      assertResumeUploadAllowed({
        size: 1000,
        mime: "text/plain",
        filename: "r.txt",
        head: new TextEncoder().encode("plain text resume"),
      }),
    ).not.toThrow();
  });

  it("skips magic check when no head is provided (defense-in-depth callers)", () => {
    expect(() =>
      assertResumeUploadAllowed({ size: 1000, mime: "application/pdf", filename: "r.pdf" }),
    ).not.toThrow();
  });
});

describe("sniffResumeMagic", () => {
  it("accepts a real PDF header", () => {
    expect(sniffResumeMagic(new TextEncoder().encode("%PDF-1.7"), ".pdf")).toBe(true);
  });

  it("rejects a mismatched PDF header", () => {
    expect(sniffResumeMagic(new TextEncoder().encode("%HTML"), ".pdf")).toBe(false);
  });

  it("accepts a ZIP-based DOCX", () => {
    const zip = new Uint8Array(8);
    zip[0] = 0x50;
    zip[1] = 0x4b;
    expect(sniffResumeMagic(zip, ".docx")).toBe(true);
  });

  it("ignores unknown extensions", () => {
    expect(sniffResumeMagic(new TextEncoder().encode("anything"), "")).toBe(true);
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
