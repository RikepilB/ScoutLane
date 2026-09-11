// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  extract: vi.fn(),
  score: vi.fn(),
  job: vi.fn(),
  check: vi.fn(),
  checkRequest: vi.fn(),
  requestCheck: vi.fn(),
  docx: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: { job: { findFirst: mocks.job } } }));
vi.mock("@/lib/llm/openrouter", () => ({ getOpenRouterClient: mocks.client }));
vi.mock("@/lib/resume/extractText", () => ({ extractTextFromResumeBuffer: mocks.extract }));
vi.mock("@/lib/match/scoreResumeForJob", () => ({ scoreResumeForJob: mocks.score }));
vi.mock("@/lib/rate-limit-db", () => ({
  checkResumeMatchRateLimits: mocks.check,
  checkResumeMatchRequestRateLimits: mocks.checkRequest,
}));
vi.mock("@/lib/rate-limit", () => ({
  clientIpFromHeaders: () => "test",
  createRateLimiter: () => ({ check: mocks.requestCheck }),
}));
vi.mock("@/lib/resume/docx-preflight", () => ({ assertSafeDocxArchive: mocks.docx }));
import { POST } from "./route";
function request(overrides: Record<string, string> = {}, file = new File(["%PDF- resume"], "resume.pdf", { type: "application/pdf" })) {
  const form = new FormData();
  form.set("consent", "true"); form.set("jobDescription", "Looking for a TypeScript engineer with experience building web applications.");
  form.set("resumeFile", file);
  for (const [key, value] of Object.entries(overrides)) form.set(key, value);
  return new Request("http://localhost/api/public/resume-match", { method: "POST", body: form });
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.check.mockResolvedValue({ allowed: true, retryAfter: 0 }); mocks.client.mockReturnValue({});
  mocks.checkRequest.mockResolvedValue({ allowed: true, retryAfter: 0 });
  mocks.requestCheck.mockReturnValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 });
  mocks.extract.mockResolvedValue("Experienced TypeScript engineer building accessible web applications.");
  mocks.score.mockResolvedValue({
    score: 0.7,
    matchedEvidence: [{ jobExcerpt: "TypeScript", resumeExcerpt: "TypeScript engineer" }],
    missingRequirements: [{ jobExcerpt: "SQL" }],
    rationale: "1 job requirement has supporting resume evidence; 1 remains unverified.",
    improvements: [],
  });
});
describe("public resume match", () => {
  it("returns missing evidence without creating an application", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ missingRequirements: [{ jobExcerpt: "SQL" }] });
    expect(response.headers.get("cache-control")).toBe("no-store"); expect(mocks.job).not.toHaveBeenCalled();
  });
  it("requires consent before any AI processing", async () => {
    expect((await POST(request({ consent: "false" }))).status).toBe(400);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(mocks.score).not.toHaveBeenCalled();
  });
  it("rejects a vague job description", async () => { expect((await POST(request({ jobDescription: "hi" }))).status).toBe(400); });
  it("does not present missing configuration as a zero score", async () => { mocks.client.mockReturnValue(null); expect((await POST(request())).status).toBe(503); });
  it("rejects invalid PDF content", async () => { expect((await POST(request({}, new File(["bad"], "resume.pdf")))).status).toBe(400); });
  it("rejects unreadable resumes", async () => { mocks.extract.mockResolvedValue(""); expect((await POST(request())).status).toBe(422); });
  it("only resolves published non-archived jobs", async () => {
    mocks.job.mockResolvedValue(null); expect((await POST(request({ jobSlug: "closed" }))).status).toBe(404);
    expect(mocks.job).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "closed", published: true, archived: false } }));
  });
  it("uses a distributed budget before reading or parsing the document", async () => {
    mocks.checkRequest.mockResolvedValue({ allowed: false, retryAfter: 60 });
    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(mocks.extract).not.toHaveBeenCalled();
    expect(mocks.check).not.toHaveBeenCalled();
  });
  it("passes a published job's labelled structured fields to the advisory scorer", async () => {
    const publishedJob = {
      title: "Staff engineer",
      description: "Lead platform delivery.",
      whatYouWillDo: "Own reliability improvements.",
      requirements: ["Distributed systems"],
      toolsAndSkills: ["TypeScript"],
    };
    mocks.job.mockResolvedValue(publishedJob);

    expect((await POST(request({ jobSlug: "staff-engineer" }))).status).toBe(200);
    expect(mocks.score).toHaveBeenCalledWith({
      resumeText: expect.stringContaining("TypeScript engineer"),
      job: publishedJob,
    });
  });
  it("redacts provider failures", async () => {
    mocks.score.mockRejectedValue(new Error("private resume content")); const response = await POST(request());
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("private resume");
  });
  it("preflights DOCX archives before extraction", async () => {
    const file = new File(["PK synthetic"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect((await POST(request({}, file))).status).toBe(200);
    expect(mocks.docx).toHaveBeenCalledOnce();
    expect(mocks.extract).toHaveBeenCalledOnce();
  });
  it("limits requests before the billable AI call", async () => { mocks.check.mockResolvedValue({ allowed: false, retryAfter: 60 }); expect((await POST(request())).status).toBe(429); expect(mocks.extract).toHaveBeenCalled(); expect(mocks.score).not.toHaveBeenCalled(); });
  it("fails closed when the distributed limiter is unavailable", async () => { mocks.check.mockRejectedValue(new Error("database unavailable")); expect((await POST(request())).status).toBe(503); expect(mocks.score).not.toHaveBeenCalled(); });
});
