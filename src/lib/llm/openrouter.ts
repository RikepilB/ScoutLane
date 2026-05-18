import OpenAI from "openai";

let cached: OpenAI | null | undefined;

export function getOpenRouterClient(): OpenAI | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    cached = null;
    return null;
  }
  cached = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_APP_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_TITLE ?? "ScoutLane",
    },
  });
  return cached;
}

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3.1:free";
}

export function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
