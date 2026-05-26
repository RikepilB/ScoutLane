import OpenAI from "openai";

let cached: OpenAI | null | undefined;

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const DEFAULT_OPENROUTER_MODEL = "openrouter/owl-alpha";
const BUILT_IN_FALLBACK_MODELS = ["openrouter/free", "openrouter/auto"];
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function createChatCompletion(input: {
  client: OpenAI;
  model: string;
  messages: ChatMessage[];
  useJsonMode: boolean;
}): Promise<string> {
  const completion = await input.client.chat.completions.create(
    {
      model: input.model,
      temperature: 0.1,
      ...(input.useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
      messages: input.messages,
    },
    { signal: AbortSignal.timeout(getOpenRouterTimeoutMs()) },
  );

  return completion.choices[0]?.message?.content ?? "";
}

export async function createOpenRouterJsonCompletion(input: {
  client: OpenAI;
  messages: ChatMessage[];
  source: string;
}): Promise<string> {
  let lastError: unknown;

  for (const model of getOpenRouterModels()) {
    for (const useJsonMode of [true, false]) {
      try {
        return await createChatCompletion({
          client: input.client,
          model,
          messages: input.messages,
          useJsonMode,
        });
      } catch (error) {
        lastError = error;
        const mode = useJsonMode ? "json-mode" : "plain-json";
        console.warn(
          `[${input.source}] OpenRouter model failed: ${model} (${mode}) - ${getErrorMessage(error)}`,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`OpenRouter request failed after trying configured models: ${lastError.message}`)
    : new Error("OpenRouter request failed after trying configured models.");
}

export function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
