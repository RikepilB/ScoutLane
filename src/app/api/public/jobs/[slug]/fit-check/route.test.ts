// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, extractTextMock, parseResumeMock, scoreApplicantMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  extractTextMock: vi.fn(),
  parseResumeMock: vi.fn(),
  scoreApplicantMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { job: { findUnique: findUniqueMock } },
}));

vi.mock("@/lib/resume/extractText", () => ({
  extractTextFromResumeBuffer: extractTextMock,
}));

vi.mock("@/lib/llm/resume", () => ({
  parseResumeFromText: parseResumeMock,
}));

vi.mock("@/lib/match/scoreApplicant", () => ({
  scoreApplicantForJob: scoreApplicantMock,
}));

import { POST } from "./route";

function seedActiveJob() {
  findUniqueMock.mockResolvedValue({
    published: true,
    archived: false,
    description: "Build things",
    whatYouWillDo: null,
    requirements: null,
    toolsAndSkills: null,
  });
}

function pdfFile(name = "resume.pdf") {
  const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
  return new File([bytes], name, { type: "application/pdf" });
}

function postWith(ip: string, file: File | null) {
  const formData = new FormData();
  if (file) formData.set("resumeFile", file);
  const request = new Request("http://localhost/api/public/jobs/my-job/fit-check", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: formData,
  }) as never;
  return POST(request, { params: Promise.resolve({ slug: "my-job" }) });
}

beforeEach(() => {
  findUniqueMock.mockReset();
  extractTextMock.mockReset();
  parseResumeMock.mockReset();
  scoreApplicantMock.mockReset();
  extractTextMock.mockResolvedValue("resume text");
  parseResumeMock.mockResolvedValue({ skills: ["TypeScript"], workHistory: [], education: [] });
  scoreApplicantMock.mockResolvedValue({
    score: 0.8,
    matchedSkills: ["TypeScript"],
    missingSkills: [],
    rationale: "Strong overlap on core skills.",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/public/jobs/[slug]/fit-check", () => {
  it("404s when the job doesn't exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await postWith("203.0.113.1", pdfFile());
    expect(res.status).toBe(404);
  });

  it("404s when the job isn't accepting applications", async () => {
    findUniqueMock.mockResolvedValue({ published: false, archived: false });
    const res = await postWith("203.0.113.2", pdfFile());
    expect(res.status).toBe(404);
  });

  it("400s when no resume file is provided", async () => {
    seedActiveJob();
    const res = await postWith("203.0.113.3", null);
    expect(res.status).toBe(400);
  });

  it("400s when the file content doesn't match its declared PDF type (magic-byte check)", async () => {
    seedActiveJob();
    const fakePdf = new File([new Uint8Array([0, 0, 0, 0])], "resume.pdf", { type: "application/pdf" });
    const res = await postWith("203.0.113.4", fakePdf);
    expect(res.status).toBe(400);
    expect(scoreApplicantMock).not.toHaveBeenCalled();
  });

  it("returns a score without persisting anything on success", async () => {
    seedActiveJob();
    const res = await postWith("203.0.113.5", pdfFile());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      score: 0.8,
      matchedSkills: ["TypeScript"],
      rationale: "Strong overlap on core skills.",
    });
  });

  it("429s with Retry-After once an IP exceeds the rate limit", async () => {
    seedActiveJob();
    const ip = "203.0.113.6";
    for (let i = 0; i < 5; i++) {
      const ok = await postWith(ip, pdfFile());
      expect(ok.status).toBe(200);
    }

    const limited = await postWith(ip, pdfFile());
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });

  it("500s cleanly when scoring throws", async () => {
    seedActiveJob();
    scoreApplicantMock.mockRejectedValue(new Error("boom"));
    const res = await postWith("203.0.113.7", pdfFile());
    expect(res.status).toBe(500);
  });
});
