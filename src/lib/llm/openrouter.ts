import OpenAI from "openai";

let cached: OpenAI | null | undefined;

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";
const BUILT_IN_FALLBACK_MODELS = ["google/gemini-2.5-flash-lite", "openrouter/auto"];
const DEFAULT_OPENROUTER_TIMEOUT_MS = 20_000;

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
  return process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
}

export function getOpenRouterModels(): string[] {
  const models = [
    getOpenRouterModel(),
    ...(process.env.OPENROUTER_FALLBACK_MODELS ?? "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean),
    DEFAULT_OPENROUTER_MODEL,
    ...BUILT_IN_FALLBACK_MODELS,
  ];
  return Array.from(new Set(models));
}

function getOpenRouterTimeoutMs(): number {
  const value = Number(process.env.OPENROUTER_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_OPENROUTER_TIMEOUT_MS;
}

async function createChatCompletion(input: {
  client: OpenAI;
  model: string;
  messages: ChatMessage[];
  useJsonMode: boolean;
  timeoutMs: number;
}): Promise<string> {
  const completion = await input.client.chat.completions.create(
    {
      model: input.model,
      temperature: 0.1,
      ...(input.useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
      messages: input.messages,
    },
    { signal: AbortSignal.timeout(input.timeoutMs) },
  );

  return completion.choices[0]?.message?.content ?? "";
}

export async function createOpenRouterJsonCompletion(input: {
  client: OpenAI;
  messages: ChatMessage[];
  source: string;
  maxAttempts?: number;
  timeoutMs?: number;
  validate?: (content: string) => void;
}): Promise<string> {
  let attempts = 0;
  const maxAttempts = input.maxAttempts === undefined
    ? Number.POSITIVE_INFINITY
    : Math.max(1, Math.floor(input.maxAttempts));
  const timeoutMs = input.timeoutMs ?? getOpenRouterTimeoutMs();

  for (const model of getOpenRouterModels()) {
    for (const useJsonMode of [true, false]) {
      if (attempts >= maxAttempts) break;
      attempts += 1;
      try {
        const content = await createChatCompletion({
          client: input.client,
          model,
          messages: input.messages,
          useJsonMode,
          timeoutMs,
        });
        input.validate?.(content);
        return content;
      } catch {
        const mode = useJsonMode ? "json-mode" : "plain-json";
        console.warn(`[${input.source}] OpenRouter attempt ${attempts} failed: ${model} (${mode})`);
      }
    }
    if (attempts >= maxAttempts) break;
  }

  throw new Error("OpenRouter request failed after trying configured models.");
}

export function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
