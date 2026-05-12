import { z } from "zod";
import { getGeminiClient } from "./client";

export const parsedResumeSchema = z.object({
  summary: z.string().default("Structured parsing stub output"),
  fullName: z.string().nullable().default(null),
  email: z.string().email().nullable().default(null),
  phone: z.string().nullable().default(null),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().nullable().default(null),
      fieldOfStudy: z.string().nullable().default(null),
      graduationYear: z.string().nullable().default(null),
      timePeriod: z.string().nullable().default(null),
    }),
  ),
  workHistory: z.array(
    z.object({
      company: z.string(),
      jobTitle: z.string().nullable().default(null),
      duration: z.string().nullable().default(null),
    }),
  ),
  skills: z.array(z.string()),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export async function parseResumeWithGemini(resumeText: string): Promise<ParsedResume> {
  if (!resumeText.trim()) {
    return {
      summary: "No resume text was provided to the parsing stub.",
      fullName: null,
      email: null,
      phone: null,
      education: [],
      workHistory: [],
      skills: [],
    };
  }

  const client = getGeminiClient();

  if (!client) {
    return {
      summary: "Gemini stub skipped because GEMINI_API_KEY is not configured.",
      fullName: null,
      email: null,
      phone: null,
      education: [],
      workHistory: [],
      skills: [],
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
- email: string | null
- phone: string | null
- education: array of { institution, degree, fieldOfStudy, graduationYear, timePeriod }
- workHistory: array of { company, jobTitle, duration }
- skills: array of strings

Only use information present in the resume. Use null or empty arrays when missing.

Resume:
${resumeText}
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parsedResumeSchema.parse(JSON.parse(responseText));
}
