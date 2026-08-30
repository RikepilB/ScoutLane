import { z } from "zod";
import { validateEgressUrl } from "@/lib/webhook/validate-egress-url";
import { createOpenRouterJsonCompletion, getOpenRouterClient, stripFences } from "@/lib/llm/openrouter";

export const parsedJobPostingSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  type: z.string().nullable().default(null),
  salary: z.string().nullable().default(null),
  department: z.string().nullable().default(null),
  whatYouWillDo: z.string().nullable().default(null),
  requirements: z.string().nullable().default(null),
  toolsAndSkills: z.string().nullable().default(null),
});

export type ParsedJobPosting = z.infer<typeof parsedJobPostingSchema>;

const EMPTY_STUB: ParsedJobPosting = {
  title: null,
  description: null,
  location: null,
  type: null,
  salary: null,
  department: null,
  whatYouWillDo: null,
  requirements: null,
  toolsAndSkills: null,
};

const MAX_PAGE_TEXT_CHARS = 8000;

/**
 * Strips a page down to readable text. Not a full HTML parser — job-posting pages don't need
 * one, and pulling in a DOM implementation (jsdom is dev-only here) for this would be overkill.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|p|div|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_PAGE_TEXT_CHARS);
}

const PROMPT_BODY = `
Extract job posting details from this web page's text into a JSON object matching this schema:
- title: string | null — the job title
- description: string | null — a prose summary of the role (2-4 sentences)
- location: string | null — city/region or "Remote"
- type: string | null — e.g. "Full-time", "Contract", "Part-time"
- salary: string | null — compensation range or figure, as stated
- department: string | null — team or department name
- whatYouWillDo: string | null — key responsibilities, as prose or a short bulleted list
- requirements: string | null — required qualifications, one per line
- toolsAndSkills: string | null — tools/technologies/skills mentioned, one per line

Only use information present in the page text. Use null for anything not clearly stated —
never invent details. This page may contain navigation, footers, or unrelated content mixed
in with the job posting; ignore anything that isn't part of the posting itself.
Output exactly the listed keys and no others.

Page text:
`;

export async function parseJobPostingFromText(pageText: string): Promise<ParsedJobPosting> {
  if (!pageText.trim()) {
    return EMPTY_STUB;
  }

  const client = getOpenRouterClient();
  if (!client) {
    return EMPTY_STUB;
  }

  const prompt = `${PROMPT_BODY}${pageText}`;

  async function callOnce(): Promise<string> {
    return createOpenRouterJsonCompletion({
      client: client!,
      source: "parseJobPostingFromText",
      messages: [
        {
          role: "system",
          content: "Return ONLY a JSON object. No prose, no markdown, no code fences.",
        },
        { role: "user", content: prompt },
      ],
    });
  }

  let raw = await callOnce();
  try {
    return parsedJobPostingSchema.parse(JSON.parse(stripFences(raw)));
  } catch (firstErr) {
    console.warn("[parseJobPostingFromText] first attempt failed Zod/JSON, retrying once", firstErr);
    raw = await callOnce();
    return parsedJobPostingSchema.parse(JSON.parse(stripFences(raw)));
  }
}

export class JobUrlFetchError extends Error {}

/** Fetches a public job-posting URL and extracts structured fields via the LLM. */
export async function parseJobFromUrl(url: string): Promise<ParsedJobPosting> {
  const validatedUrl = await validateEgressUrl(url).catch((error: Error) => {
    throw new JobUrlFetchError(error.message);
  });

  let response: Response;
  try {
    response = await fetch(validatedUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "text/html" },
    });
  } catch (error) {
    throw new JobUrlFetchError(`Could not reach that URL: ${(error as Error).message}`);
  }

  if (!response.ok) {
    throw new JobUrlFetchError(
      response.status >= 300 && response.status < 400
        ? "That URL redirects elsewhere — paste the final destination URL instead."
        : `That URL returned an error (${response.status}).`,
    );
  }

  const html = await response.text();
  const pageText = htmlToPlainText(html);
  return parseJobPostingFromText(pageText);
}
