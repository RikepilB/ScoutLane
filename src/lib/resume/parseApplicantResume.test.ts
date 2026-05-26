// @vitest-environment node
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applicantUpdate,
  applicantFindUnique,
  resumeFileFindUnique,
  extractTextMock,
  parseResumeMock,
  scoreApplicantMock,
} = vi.hoisted(() => ({
  applicantUpdate: vi.fn(),
  applicantFindUnique: vi.fn(),
  resumeFileFindUnique: vi.fn(),
  extractTextMock: vi.fn(),
  parseResumeMock: vi.fn(),
  scoreApplicantMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    applicant: { update: applicantUpdate, findUnique: applicantFindUnique },
    resumeFile: { findUnique: resumeFileFindUnique },
  },
}));

vi.mock("./extractText", () => ({
  extractTextFromResumeBuffer: extractTextMock,
}));

vi.mock("@/lib/storage/client", () => ({
  getBucket: vi.fn(),
  getStorageConfig: vi.fn(),
  isStorageConfigured: () => false,
}));

vi.mock("@/lib/llm/resume", () => ({
  parseResumeFromText: parseResumeMock,
}));

vi.mock("@/lib/match/scoreApplicant", () => ({
  scoreApplicantInline: scoreApplicantMock,
}));

import {
  parseApplicantResumeFromBuffer,
  parseApplicantResumeFromUrl,
} from "./parseApplicantResume";
import { LOCAL_RESUME_STORAGE_DIR } from "@/lib/storage/upload";

beforeEach(() => {
  applicantUpdate.mockReset();
  applicantFindUnique.mockReset();
  resumeFileFindUnique.mockReset();
  extractTextMock.mockReset();
  parseResumeMock.mockReset();
  scoreApplicantMock.mockReset();
  applicantUpdate.mockResolvedValue({});
  scoreApplicantMock.mockResolvedValue(undefined);
});

const PARSED_RESUME = {
  education: [],
  workHistory: [],
  skills: [],
  skillsConfidence: 0,
  fullNameConfidence: 0,
  emailConfidence: 0,
  phoneConfidence: 0,
};

describe("parseApplicantResumeFromBuffer", () => {
  it("prunes stale parsingError/parsingFailedAt keys on a successful re-parse", async () => {
    applicantFindUnique.mockResolvedValue({
      data: {
        customFields: { city: "Lima" },
        parsingError: "previous failure",
        parsingFailedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    extractTextMock.mockResolvedValue("Resume text body");
    parseResumeMock.mockResolvedValue(PARSED_RESUME);

    await parseApplicantResumeFromBuffer("applicant-1", Buffer.from("pdf"), "resume.pdf");

    const completedCall = applicantUpdate.mock.calls.find(
      (call) => call[0]?.data?.parsingStatus === "COMPLETED",
    );
    expect(completedCall).toBeDefined();
    const persisted = completedCall![0].data.data;
    expect(persisted.parsingError).toBeUndefined();
    expect(persisted.parsingFailedAt).toBeUndefined();
    expect(persisted.customFields).toEqual({ city: "Lima" });
  });

  it("scrubs secret-like patterns from the persisted parsingError on failure", async () => {
    applicantFindUnique.mockResolvedValue({ data: null });
    extractTextMock.mockRejectedValue(
      new Error("OpenRouter rejected: api_key=sk-or-v1-aaaaaaaaaaaaaaaaaaaaaaaa"),
    );

    await expect(
      parseApplicantResumeFromBuffer("applicant-1", Buffer.from("pdf"), "resume.pdf"),
    ).rejects.toThrow();

    const failedCall = applicantUpdate.mock.calls.find(
      (call) => call[0]?.data?.parsingStatus === "FAILED",
    );
    expect(failedCall).toBeDefined();
    const persistedError = failedCall![0].data.data.parsingError;
    expect(persistedError).not.toContain("sk-or-v1-");
    expect(persistedError).toContain("[REDACTED]");
  });
});

describe("parseApplicantResumeFromUrl", () => {
  it("loads local app resume URLs from storage without depending on NEXT_PUBLIC_APP_URL", async () => {
    const objectName = "resumes/2026-05/local-resume.pdf";
    const filePath = path.join(LOCAL_RESUME_STORAGE_DIR, objectName);
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, Buffer.from("pdf bytes"));
    applicantFindUnique.mockResolvedValue({ data: null });
    extractTextMock.mockResolvedValue("Resume text body");
    parseResumeMock.mockResolvedValue(PARSED_RESUME);
    const fetchMock = vi.spyOn(globalThis, "fetch");

    try {
      await parseApplicantResumeFromUrl("applicant-1", `/api/resumes/${objectName}`);
    } finally {
      if (originalAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
      }
      fetchMock.mockRestore();
      await rm(filePath, { force: true });
    }

    expect(fetchMock).not.toHaveBeenCalled();
    expect(extractTextMock).toHaveBeenCalledWith(
      Buffer.from("pdf bytes"),
      "local-resume.pdf",
    );
    expect(resumeFileFindUnique).not.toHaveBeenCalled();
  });
});
