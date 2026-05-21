// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({
  default: undefined,
  PDFParse: class {
    static setWorker(_workerSrc?: string) {
      return "";
    }
    constructor(_input: { data: Uint8Array }) {}
    async getText() {
      return { text: "Parsed PDF resume text" };
    }
    async destroy() {}
  },
}));

import { extractTextFromResumeBuffer } from "./extractText";

describe("extractTextFromResumeBuffer", () => {
  it("extracts text through pdf-parse v2 PDFParse", async () => {
    await expect(
      extractTextFromResumeBuffer(Buffer.from("%PDF fixture"), "resume.pdf"),
    ).resolves.toBe("Parsed PDF resume text");
  });

  it("extracts plain text fallback files", async () => {
    await expect(
      extractTextFromResumeBuffer(Buffer.from("Resume text"), "resume.txt"),
    ).resolves.toBe("Resume text");
  });

  it("extracts CSV resume text", async () => {
    await expect(
      extractTextFromResumeBuffer(Buffer.from("name,skills\nJane Doe,TypeScript"), "resume.csv"),
    ).resolves.toBe("name,skills\nJane Doe,TypeScript");
  });
});
