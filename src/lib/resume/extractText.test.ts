// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { extractTextFromResumeBuffer } from "./extractText";

describe("extractTextFromResumeBuffer", () => {
  it("extracts text through the Node pdf-parse build", async () => {
    const sample = readFileSync(
      join(process.cwd(), "docs", "samples of resumes", "sanaa_syed_resume.pdf"),
    );

    await expect(extractTextFromResumeBuffer(sample, "resume.pdf")).resolves.toContain(
      "SANAA SYED",
    );
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
