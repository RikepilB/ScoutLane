import { z } from "zod";
import { createOpenRouterJsonCompletion, getOpenRouterClient, stripFences } from "./openrouter";
import type { ParsedResume } from "./resume";

export const draftedEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1).max(20000),
});

export type DraftedEmail = z.infer<typeof draftedEmailSchema>;

const TONE_BY_STATUS: Record<string, string> = {
  SHORTLISTED: "warm and encouraging — they've been shortlisted, next steps are still ahead",
  INTERVIEW: "warm and specific — inviting them to schedule an interview, ask for availability",
  OFFERED: "excited and clear — extending an offer, mention a formal offer document is coming separately",
  REJECTED: "kind, brief, and respectful — declining, without being cold or overly apologetic",
};

const DEFAULT_TONE = "professional and friendly — a general status update";

const MAX_RESUME_CHARS = 4000;

export async function draftStageEmail(input: {
  applicantName: string;
  jobTitle: string;
  targetStatus: string;
  parsedResume?: ParsedResume | null;
}): Promise<DraftedEmail | null> {
  const client = getOpenRouterClient();
  if (!client) return null;

  const tone = TONE_BY_STATUS[input.targetStatus] ?? DEFAULT_TONE;
  const resumeContext = input.parsedResume
    ? JSON.stringify({
        skills: input.parsedResume.skills,
        workHistory: input.parsedResume.workHistory.slice(0, 3),
      }).slice(0, MAX_RESUME_CHARS)
    : null;

  const prompt = `
Draft a short recruiting email to a candidate. Return ONLY a JSON object with this exact shape:
{
  "subject": "<email subject line>",
  "bodyHtml": "<email body as simple HTML: <p> paragraphs, <strong> for emphasis, no other tags>"
}

Candidate name: ${input.applicantName}
Job title: ${input.jobTitle}
Tone: ${tone}
${resumeContext ? `Candidate background (for a personalized detail or two, don't just list it back):\n${resumeContext}` : ""}

Keep it to 3-5 short paragraphs. Sign off as "ScoutLane Hiring Team". Address the candidate by
first name only if a full name was given. Do not invent specifics about compensation, start
dates, or interview logistics beyond what a generic template would say — those get filled in
by the recruiter.
`.trim();

  async function callOnce(): Promise<string> {
    return createOpenRouterJsonCompletion({
      client: client!,
      source: "draftStageEmail",
      messages: [
        {
          role: "system",
          content: "Return ONLY a JSON object. No markdown, no prose, no code fences.",
        },
        { role: "user", content: prompt },
      ],
    });
  }

  let raw = await callOnce();
  try {
    return draftedEmailSchema.parse(JSON.parse(stripFences(raw)));
  } catch (firstErr) {
    console.warn("[draftStageEmail] first attempt failed Zod/JSON, retrying once", firstErr);
    raw = await callOnce();
    return draftedEmailSchema.parse(JSON.parse(stripFences(raw)));
  }
}
