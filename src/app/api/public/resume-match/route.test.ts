// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), extract: vi.fn(), parse: vi.fn(), score: vi.fn(), job: vi.fn(), check: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { job: { findFirst: mocks.job } } }));
vi.mock("@/lib/llm/openrouter", () => ({ getOpenRouterClient: mocks.client }));
vi.mock("@/lib/llm/resume", () => ({ parseResumeFromText: mocks.parse }));
vi.mock("@/lib/resume/extractText", () => ({ extractTextFromResumeBuffer: mocks.extract }));
vi.mock("@/lib/match/scoreApplicant", () => ({ scoreApplicantForJob: mocks.score }));
vi.mock("@/lib/rate-limit", () => ({ createRateLimiter: () => ({ check: mocks.check }), clientIpFromHeaders: () => "test" }));
import { POST } from "./route";
function request(overrides: Record<string, string> = {}, file = new File(["%PDF- resume"], "resume.pdf", { type: "application/pdf" })) {
  const form = new FormData();
  form.set("consent", "true"); form.set("jobDescription", "Looking for a TypeScript engineer with experience building web applications.");
  form.set("resumeFile", file);
  for (const [key, value] of Object.entries(overrides)) form.set(key, value);
  return new Request("http://localhost/api/public/resume-match", { method: "POST", body: form });
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.check.mockReturnValue({ allowed: true }); mocks.client.mockReturnValue({});
  mocks.extract.mockResolvedValue("Experienced TypeScript engineer building accessible web applications.");
  mocks.parse.mockResolvedValue({ skills: ["TypeScript"], education: [], workHistory: [] });
  mocks.score.mockResolvedValue({ score: 0.7, matchedSkills: ["TypeScript"], missingSkills: ["SQL"], rationale: "SQL is not demonstrated." });
});
describe("public resume match", () => {
  it("returns missing evidence without creating an application", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ missingSkills: ["SQL"] });
    expect(response.headers.get("cache-control")).toBe("no-store"); expect(mocks.job).not.toHaveBeenCalled();
  });
  it("requires consent before any AI processing", async () => {
    expect((await POST(request({ consent: "false" }))).status).toBe(400); expect(mocks.parse).not.toHaveBeenCalled();
  });
  it("rejects a vague job description", async () => { expect((await POST(request({ jobDescription: "hi" }))).status).toBe(400); });
  it("does not present missing configuration as a zero score", async () => { mocks.client.mockReturnValue(null); expect((await POST(request())).status).toBe(503); });
  it("rejects invalid PDF content", async () => { expect((await POST(request({}, new File(["bad"], "resume.pdf")))).status).toBe(400); });
  it("rejects unreadable resumes", async () => { mocks.extract.mockResolvedValue(""); expect((await POST(request())).status).toBe(422); });
  it("only resolves published non-archived jobs", async () => {
    mocks.job.mockResolvedValue(null); expect((await POST(request({ jobSlug: "closed" }))).status).toBe(404);
    expect(mocks.job).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "closed", published: true, archived: false } }));
  });
  it("redacts provider failures", async () => {
    mocks.parse.mockRejectedValue(new Error("private resume content")); const response = await POST(request());
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("private resume");
  });
  it("limits requests before processing", async () => { mocks.check.mockReturnValue({ allowed: false }); expect((await POST(request())).status).toBe(429); expect(mocks.extract).not.toHaveBeenCalled(); });
});
