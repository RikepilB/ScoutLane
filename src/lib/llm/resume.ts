import { z } from "zod";
import { getGeminiClient } from "./client";

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

export async function parseResumeWithGemini(resumeText: string): Promise<ParsedResume> {
  if (!resumeText.trim()) {
    return {
      summary: "No resume text was provided to the parsing stub.",
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
  }

  const client = getGeminiClient();

  if (!client) {
    return {
      summary: "Gemini stub skipped because GEMINI_API_KEY is not configured.",
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
  }

  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const prompt = `
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
${resumeText}
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parsedResumeSchema.parse(JSON.parse(responseText));
}
