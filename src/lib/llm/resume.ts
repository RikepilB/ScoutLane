import { z } from "zod";
import { getOpenRouterClient, getOpenRouterModels, stripFences } from "./openrouter";

export const parsedResumeSchema = z.object({
  summary: z.string().default("Structured parsing stub output"),
  fullName: z.string().nullable().default(null),
  fullNameConfidence: z.enum(["high", "medium", "low"]).default("medium"),
  email: z.string().email().nullable().default(null),
  emailConfidence: z.enum(["high", "medium", "low"]).default("medium"),
  phone: z.string().nullable().default(null),
  phoneConfidence: z.enum(["high", "medium", "low"]).default("medium"),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().nullable().default(null),
      fieldOfStudy: z.string().nullable().default(null),
      graduationYear: z.string().nullable().default(null),
      timePeriod: z.string().nullable().default(null),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
  workHistory: z.array(
    z.object({
      company: z.string(),
      jobTitle: z.string().nullable().default(null),
      duration: z.string().nullable().default(null),
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
  skills: z.array(z.string()),
  skillsConfidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

const EMPTY_STUB: ParsedResume = {
  summary: "No resume text was provided to the parser.",
  fullName: null,
  fullNameConfidence: "low",
  email: null,
  emailConfidence: "low",
  phone: null,
  phoneConfidence: "low",
  education: [],
  workHistory: [],
  skills: [],
  skillsConfidence: "low",
};

const PROMPT_BODY = `
Return a JSON object matching this schema:
- summary: string
- fullName: string | null
- fullNameConfidence: "high" | "medium" | "low"
- email: string | null
- emailConfidence: "high" | "medium" | "low"
- phone: string | null
- phoneConfidence: "high" | "medium" | "low"
- education: array of { institution, degree, fieldOfStudy, graduationYear, timePeriod, confidence }
- workHistory: array of { company, jobTitle, duration, confidence }
- skills: array of strings
- skillsConfidence: "high" | "medium" | "low"

For confidence: use "high" when the field is clearly stated in the resume,
"medium" when you can infer it from context,
"low" when the field is missing or highly uncertain.
If a field is null, set its confidence to "low".

Only use information present in the resume. Use null or empty arrays when missing.

Resume:
`;

export async function parseResumeFromText(resumeText: string): Promise<ParsedResume> {
  if (!resumeText.trim()) {
    return EMPTY_STUB;
  }

  const client = getOpenRouterClient();
  if (!client) {
    return {
      ...EMPTY_STUB,
      summary: "Parser skipped because OPENROUTER_API_KEY is not configured.",
    };
  }

  const prompt = `${PROMPT_BODY}${resumeText}`;

  async function callOnce(): Promise<string> {
    let lastError: unknown;
    for (const model of getOpenRouterModels()) {
      try {
        const completion = await client!.chat.completions.create({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Return ONLY a JSON object. No prose, no markdown, no code fences.",
            },
            { role: "user", content: prompt },
          ],
        });
        return completion.choices[0]?.message?.content ?? "";
      } catch (error) {
        lastError = error;
        console.warn(`[parseResumeFromText] OpenRouter model failed: ${model}`, error);
      }
    }
    throw lastError;
  }

  let raw = await callOnce();
  try {
    return parsedResumeSchema.parse(JSON.parse(stripFences(raw)));
  } catch (firstErr) {
    console.warn("[parseResumeFromText] first attempt failed Zod/JSON, retrying once", firstErr);
    raw = await callOnce();
    return parsedResumeSchema.parse(JSON.parse(stripFences(raw)));
  }
}
