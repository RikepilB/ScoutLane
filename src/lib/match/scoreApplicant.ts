import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getOpenRouterClient, getOpenRouterModel, stripFences } from "@/lib/llm/openrouter";
import type { ParsedResume } from "@/lib/llm/resume";

export const matchResultSchema = z.object({
  score: z.number().min(0).max(1),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  rationale: z.string().max(800),
});

export type MatchResult = z.infer<typeof matchResultSchema>;

const MAX_JD_CHARS = 12_000;
const MAX_RESUME_CHARS = 16_000;

export async function scoreApplicantForJob(input: {
  jobDescription: string | null;
  parsedResume: ParsedResume;
}): Promise<MatchResult> {
  const { jobDescription, parsedResume } = input;

  if (!jobDescription || jobDescription.trim().length === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      rationale: "No job description on file; cannot score.",
    };
  }

  const hasContent =
    parsedResume.skills.length > 0 ||
    parsedResume.workHistory.length > 0 ||
    parsedResume.education.length > 0;

  if (!hasContent) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      rationale: "Resume contained no extractable skills, work, or education.",
    };
  }

  const client = getOpenRouterClient();
  if (!client) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      rationale: "Scoring skipped: OPENROUTER_API_KEY is not configured.",
    };
  }

  const jd = jobDescription.slice(0, MAX_JD_CHARS);
  const resumeJson = JSON.stringify({
    summary: parsedResume.summary,
    skills: parsedResume.skills,
    workHistory: parsedResume.workHistory,
    education: parsedResume.education,
  }).slice(0, MAX_RESUME_CHARS);

  const prompt = `
You are a recruiting screener. Compare a candidate's parsed resume against a job description and produce a JSON match assessment.

Return ONLY a JSON object with this exact shape:
{
  "score": <number 0..1, how well this candidate fits the role>,
  "matchedSkills": [<skills from the resume that satisfy a JD requirement>],
  "missingSkills": [<skills the JD requires that the resume does not show>],
  "rationale": "<2-3 sentence plain-English justification, max 800 chars>"
}

Scoring rubric:
- 0.90-1.00: meets/exceeds all stated requirements, strong overlap on must-haves and nice-to-haves
- 0.70-0.89: meets all must-haves, some nice-to-haves missing
- 0.50-0.69: meets most must-haves; notable gaps
- 0.30-0.49: meets some must-haves; major gaps
- 0.00-0.29: clear mismatch
Bias toward 0.50 when the JD is vague.

Job description:
"""
${jd}
"""

Parsed resume (JSON):
${resumeJson}
`.trim();

  async function callOnce(): Promise<string> {
    const completion = await client!.chat.completions.create({
      model: getOpenRouterModel(),
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return ONLY a JSON object. No markdown, no prose, no code fences.",
        },
        { role: "user", content: prompt },
      ],
    });
    return completion.choices[0]?.message?.content ?? "";
  }

  let raw = await callOnce();
  try {
    return matchResultSchema.parse(JSON.parse(stripFences(raw)));
  } catch (firstErr) {
    console.warn("[scoreApplicantForJob] first attempt failed Zod/JSON, retrying once", firstErr);
    raw = await callOnce();
    return matchResultSchema.parse(JSON.parse(stripFences(raw)));
  }
}

export async function scoreApplicantInline(applicantId: string): Promise<void> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: {
      parsedData: true,
      data: true,
      job: { select: { description: true } },
    },
  });
  if (!applicant?.parsedData) return;

  const result = await scoreApplicantForJob({
    jobDescription: applicant.job.description,
    parsedResume: applicant.parsedData as unknown as ParsedResume,
  });

  const prevData =
    applicant.data && typeof applicant.data === "object"
      ? { ...(applicant.data as Record<string, unknown>) }
      : {};

  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      score: result.score,
      data: {
        ...prevData,
        match: { ...result, scoredAt: new Date().toISOString() },
      } as Prisma.InputJsonValue,
    },
  });
}
