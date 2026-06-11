// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenRouterJsonCompletion, getOpenRouterModel, getOpenRouterModels } from "./openrouter";

const originalModel = process.env.OPENROUTER_MODEL;
const originalFallbackModels = process.env.OPENROUTER_FALLBACK_MODELS;

afterEach(() => {
  if (originalModel === undefined) {
    delete process.env.OPENROUTER_MODEL;
  } else {
    process.env.OPENROUTER_MODEL = originalModel;
  }

  if (originalFallbackModels === undefined) {
    delete process.env.OPENROUTER_FALLBACK_MODELS;
  } else {
    process.env.OPENROUTER_FALLBACK_MODELS = originalFallbackModels;
  }

  vi.restoreAllMocks();
});

describe("OpenRouter model selection", () => {
  it("uses Gemini 2.5 Flash as the default model", () => {
    delete process.env.OPENROUTER_MODEL;

    expect(getOpenRouterModel()).toBe("google/gemini-2.5-flash");
  });

  it("deduplicates configured models and keeps built-in fallbacks", () => {
    process.env.OPENROUTER_MODEL = "model-a";
    process.env.OPENROUTER_FALLBACK_MODELS = "model-b, model-a, openrouter/auto";

    expect(getOpenRouterModels()).toEqual([
      "model-a",
      "model-b",
      "openrouter/auto",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
    ]);
  });
});

describe("createOpenRouterJsonCompletion", () => {
  it("retries the same model without JSON mode when a provider rejects response_format", async () => {
    process.env.OPENROUTER_MODEL = "model-a";
    delete process.env.OPENROUTER_FALLBACK_MODELS;

    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error("response_format is not supported"))
      .mockResolvedValueOnce({
        choices: [{ message: { content: "{\"ok\":true}" } }],
      });

    const client = {
      chat: { completions: { create } },
    };

    await expect(
      createOpenRouterJsonCompletion({
        client: client as never,
        source: "test",
        messages: [{ role: "user", content: "return json" }],
      }),
    ).resolves.toBe("{\"ok\":true}");

    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: "model-a",
        response_format: { type: "json_object" },
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({
        response_format: expect.anything(),
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
