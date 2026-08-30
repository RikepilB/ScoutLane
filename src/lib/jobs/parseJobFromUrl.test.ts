// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateEgressUrl: vi.fn(),
  getOpenRouterClient: vi.fn(),
  createOpenRouterJsonCompletion: vi.fn(),
}));

vi.mock("@/lib/webhook/validate-egress-url", () => ({
  validateEgressUrl: mocks.validateEgressUrl,
}));

vi.mock("@/lib/llm/openrouter", () => ({
  getOpenRouterClient: mocks.getOpenRouterClient,
  createOpenRouterJsonCompletion: mocks.createOpenRouterJsonCompletion,
  stripFences: (text: string) =>
    text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim(),
}));

import { htmlToPlainText, JobUrlFetchError, parseJobFromUrl, parseJobPostingFromText } from "./parseJobFromUrl";

afterEach(() => {
  mocks.validateEgressUrl.mockReset();
  mocks.getOpenRouterClient.mockReset();
  mocks.createOpenRouterJsonCompletion.mockReset();
  vi.unstubAllGlobals();
});

describe("htmlToPlainText", () => {
  it("strips scripts, styles, and tags, keeping readable text", () => {
    const html = `
      <html><head><style>.x{color:red}</style><script>alert(1)</script></head>
      <body><h1>Senior Engineer</h1><p>We build things &amp; ship fast.</p></body></html>
    `;
    const text = htmlToPlainText(html);
    expect(text).toContain("Senior Engineer");
    expect(text).toContain("We build things & ship fast.");
    expect(text).not.toContain("alert(1)");
    expect(text).not.toContain("color:red");
  });

  it("truncates very long pages", () => {
    const html = `<p>${"x".repeat(20000)}</p>`;
    expect(htmlToPlainText(html).length).toBeLessThanOrEqual(8000);
  });
});

describe("parseJobPostingFromText", () => {
  it("returns the empty stub when OpenRouter is not configured", async () => {
    mocks.getOpenRouterClient.mockReturnValue(null);

    const result = await parseJobPostingFromText("Senior Engineer at Acme");

    expect(result.title).toBeNull();
    expect(mocks.createOpenRouterJsonCompletion).not.toHaveBeenCalled();
  });

  it("returns the empty stub for blank input without calling the LLM", async () => {
    const result = await parseJobPostingFromText("   ");
    expect(result.title).toBeNull();
    expect(mocks.getOpenRouterClient).not.toHaveBeenCalled();
  });

  it("parses a valid JSON response into the schema", async () => {
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion.mockResolvedValue(
      JSON.stringify({
        title: "Senior Backend Engineer",
        description: "Build our core platform.",
        location: "Remote",
        type: "Full-time",
        salary: "$150k-$180k",
        department: "Engineering",
        whatYouWillDo: "Ship features.",
        requirements: "5+ years experience",
        toolsAndSkills: "TypeScript\nPostgres",
      }),
    );

    const result = await parseJobPostingFromText("Senior Backend Engineer at Acme, remote, $150k-$180k");

    expect(result.title).toBe("Senior Backend Engineer");
    expect(result.location).toBe("Remote");
    expect(mocks.createOpenRouterJsonCompletion).toHaveBeenCalledTimes(1);
  });

  it("retries once on invalid JSON, then succeeds", async () => {
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(JSON.stringify({ title: "Retry Worked" }));

    const result = await parseJobPostingFromText("some job text");

    expect(result.title).toBe("Retry Worked");
    expect(mocks.createOpenRouterJsonCompletion).toHaveBeenCalledTimes(2);
  });
});

describe("parseJobFromUrl", () => {
  it("rejects a URL that fails egress validation", async () => {
    mocks.validateEgressUrl.mockRejectedValue(new Error("Endpoint URL must be a public HTTPS URL."));

    await expect(parseJobFromUrl("http://localhost/jobs/1")).rejects.toThrow(JobUrlFetchError);
  });

  it("rejects a redirect response with a clear message", async () => {
    mocks.validateEgressUrl.mockResolvedValue("https://example.test/jobs/1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 302 })),
    );

    await expect(parseJobFromUrl("https://example.test/jobs/1")).rejects.toThrow(/redirects/i);
  });

  it("fetches, strips HTML, and parses the page on success", async () => {
    mocks.validateEgressUrl.mockResolvedValue("https://example.test/jobs/1");
    mocks.getOpenRouterClient.mockReturnValue({});
    mocks.createOpenRouterJsonCompletion.mockResolvedValue(
      JSON.stringify({ title: "Found It" }),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("<html><body><h1>Found It</h1></body></html>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseJobFromUrl("https://example.test/jobs/1");

    expect(result.title).toBe("Found It");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/jobs/1",
      expect.objectContaining({ redirect: "manual" }),
    );
  });
});
