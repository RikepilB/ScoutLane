// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { extractTextFromResumeBuffer } from "./extractText";

const FIXTURE_PDF = join(__dirname, "__fixtures__", "sample-resume.pdf");
const SAMPLE_PDF = join(process.cwd(), "docs", "samples of resumes", "sanaa_syed_resume.pdf");

describe("extractTextFromResumeBuffer", () => {
  it(
    "extracts text from the committed PDF fixture",
    async () => {
      const fixture = readFileSync(FIXTURE_PDF);

      await expect(extractTextFromResumeBuffer(fixture, "resume.pdf")).resolves.toContain(
        "SCOUTLANE FIXTURE RESUME",
      );
    },
    30000,
  );

  it.skipIf(!existsSync(SAMPLE_PDF))(
    "extracts text from a real local sample resume",
    async () => {
      const sample = readFileSync(SAMPLE_PDF);

      await expect(extractTextFromResumeBuffer(sample, "resume.pdf")).resolves.toContain(
        "SANAA SYED",
      );
    },
  );

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
