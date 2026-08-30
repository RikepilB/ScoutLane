// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOpenRouterClient: vi.fn(),
  createOpenRouterJsonCompletion: vi.fn(),
}));

vi.mock("./openrouter", () => ({
  getOpenRouterClient: mocks.getOpenRouterClient,
  createOpenRouterJsonCompletion: mocks.createOpenRouterJsonCompletion,
  stripFences: (text: string) =>
    text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim(),
}));

import { draftStageEmail } from "./draftStageEmail";

afterEach(() => {
  mocks.getOpenRouterClient.mockReset();
  mocks.createOpenRouterJsonCompletion.mockReset();
});

describe("draftStageEmail", () => {
  it("returns null when OpenRouter is not configured", async () => {
    mocks.getOpenRouterClient.mockReturnValue(null);

    const result = await draftStageEmail({
      applicantName: "Jamie",
      jobTitle: "Engineer",
      targetStatus: "INTERVIEW",
    });

    expect(result).toBeNull();
    expect(mocks.createOpenRouterJsonCompletion).not.toHaveBeenCalled();
  });

  it("parses a valid draft response", async () => {
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion.mockResolvedValue(
      JSON.stringify({ subject: "Interview time?", bodyHtml: "<p>Hi Jamie</p>" }),
    );

    const result = await draftStageEmail({
      applicantName: "Jamie",
      jobTitle: "Engineer",
      targetStatus: "INTERVIEW",
    });

    expect(result).toEqual({ subject: "Interview time?", bodyHtml: "<p>Hi Jamie</p>" });
  });

  it("retries once on invalid JSON, then succeeds", async () => {
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(JSON.stringify({ subject: "Retry", bodyHtml: "<p>ok</p>" }));

    const result = await draftStageEmail({
      applicantName: "Jamie",
      jobTitle: "Engineer",
      targetStatus: "REJECTED",
    });

    expect(result?.subject).toBe("Retry");
    expect(mocks.createOpenRouterJsonCompletion).toHaveBeenCalledTimes(2);
  });

  it("includes the candidate's parsed resume in the prompt when provided", async () => {
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion.mockResolvedValue(
      JSON.stringify({ subject: "s", bodyHtml: "<p>b</p>" }),
    );

    await draftStageEmail({
      applicantName: "Jamie",
      jobTitle: "Engineer",
      targetStatus: "OFFERED",
      parsedResume: {
        summary: "",
        fullName: "Jamie",
        fullNameConfidence: "high",
        email: null,
        emailConfidence: "low",
        phone: null,
        phoneConfidence: "low",
        education: [],
        workHistory: [{ company: "Acme", jobTitle: "Engineer", duration: "2y", confidence: "high" }],
        skills: ["TypeScript", "React"],
        skillsConfidence: "high",
      },
    });

    const promptArg = mocks.createOpenRouterJsonCompletion.mock.calls[0][0];
    const userMessage = promptArg.messages.find((m: { role: string }) => m.role === "user").content;
    expect(userMessage).toContain("TypeScript");
    expect(userMessage).toContain("Acme");
  });

  it("falls back to a default tone for an unmapped status", async () => {
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion.mockResolvedValue(
      JSON.stringify({ subject: "s", bodyHtml: "<p>b</p>" }),
    );

    await draftStageEmail({ applicantName: "Jamie", jobTitle: "Engineer", targetStatus: "REVIEWING" });

    const promptArg = mocks.createOpenRouterJsonCompletion.mock.calls[0][0];
    const userMessage = promptArg.messages.find((m: { role: string }) => m.role === "user").content;
    expect(userMessage).toContain("general status update");
  });
});
