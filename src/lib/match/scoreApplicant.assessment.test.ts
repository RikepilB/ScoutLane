// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ completion: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/llm/openrouter", () => ({ getOpenRouterClient: () => ({}), createOpenRouterJsonCompletion: mocks.completion, stripFences: (s: string) => s }));
import { scoreApplicantForJob } from "./scoreApplicant";
import { parsedResumeSchema } from "@/lib/llm/resume";
const resume = parsedResumeSchema.parse({ summary: "Product manager delivering customer research and roadmaps.", skills: ["Research"], workHistory: [], education: [] });
beforeEach(() => vi.clearAllMocks());
it("accepts evidence and actionable feedback for a non-engineering role", async () => {
  mocks.completion.mockResolvedValue(JSON.stringify({ score: 0.7, matchedSkills: ["Research"], missingSkills: ["Budget ownership"], rationale: "Research is documented; budget ownership is not.", improvements: ["Clarify the scope of your customer research responsibilities."] }));
  const result = await scoreApplicantForJob({ jobDescription: "Product manager with research and budget ownership.", parsedResume: resume });
  expect(result.improvements).toEqual(["Clarify the scope of your customer research responsibilities."]);
  expect(result.missingSkills).toEqual(["Budget ownership"]);
});
it("retries out-of-range provider scores instead of displaying them", async () => {
  mocks.completion.mockResolvedValueOnce(JSON.stringify({ score: 95, rationale: "bad scale" })).mockResolvedValueOnce(JSON.stringify({ score: 0.5, rationale: "Limited evidence." }));
  expect((await scoreApplicantForJob({ jobDescription: "Product manager", parsedResume: resume })).score).toBe(0.5);
  expect(mocks.completion).toHaveBeenCalledTimes(2);
});
it("rejects malformed output after one retry", async () => {
  mocks.completion.mockResolvedValue("not JSON");
  await expect(scoreApplicantForJob({ jobDescription: "Product manager", parsedResume: resume })).rejects.toThrow();
  expect(mocks.completion).toHaveBeenCalledTimes(2);
});
