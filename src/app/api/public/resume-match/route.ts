import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOpenRouterClient } from "@/lib/llm/openrouter";
import { scoreResumeForJob, type ResumeMatchJob } from "@/lib/match/scoreResumeForJob";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";
import { checkResumeMatchRateLimits } from "@/lib/rate-limit-db";
import { assertSafeDocxArchive } from "@/lib/resume/docx-preflight";
import { extractTextFromResumeBuffer } from "@/lib/resume/extractText";
import { assertResumeUploadAllowed, MAX_RESUME_BYTES } from "@/lib/storage/upload-limits";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_REQUEST_BYTES = MAX_RESUME_BYTES + 128 * 1024;
const requestLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return reply({ error: "Invalid request origin." }, 403);
  const clientIp = clientIpFromHeaders(request.headers);
  const requestRate = requestLimiter.check(clientIp);
  if (!requestRate.allowed) {
    return NextResponse.json({ error: "Too many comparisons. Please wait before trying again." }, {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((requestRate.resetAt - Date.now()) / 1000))),
        "Cache-Control": "no-store",
      },
    });
  }
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    return reply({ error: "Upload is too large. Maximum resume size is 5 MB." }, 413);
  }
  // Enforce the bound while reading too: chunked requests may omit Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Upload a resume and job description." }, 400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return reply({ error: "Upload is too large. Maximum resume size is 5 MB." }, 413);
      }
      chunks.push(part.value);
    }
  } catch { return reply({ error: "The upload was interrupted. Please try again." }, 400); }
  const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData().catch(() => null);
  if (form?.get("consent") !== "true") return reply({ error: "Consent to AI processing is required." }, 400);
  const file = form.get("resumeFile");
  if (!(file instanceof File)) return reply({ error: "Choose a resume file." }, 400);
  if (!/\.(pdf|docx|txt)$/i.test(file.name)) return reply({ error: "Use a PDF, DOCX or TXT resume." }, 400);
  if (file.size === 0 || file.size > MAX_RESUME_BYTES) return reply({ error: "Choose a non-empty resume up to 5 MB." }, 400);
  const slugValue = form.get("jobSlug");
  const slug = typeof slugValue === "string" ? slugValue.trim() : "";
  const pastedDescription = typeof form.get("jobDescription") === "string"
    ? String(form.get("jobDescription")).trim()
    : "";
  if (slugValue !== null && (typeof slugValue !== "string" || !slug || slug.length > 200)) {
    return reply({ error: "Invalid role." }, 400);
  }
  try {
    let job: ResumeMatchJob;
    if (slug) {
      const publishedJob = await prisma.job.findFirst({
        where: { slug, published: true, archived: false },
        select: { title: true, description: true, whatYouWillDo: true, requirements: true, toolsAndSkills: true },
      });
      if (!publishedJob) return reply({ error: "This role is no longer available." }, 404);
      job = publishedJob;
    } else {
      if (pastedDescription.length < 40 || pastedDescription.length > 12_000) {
        return reply({ error: "Provide a job description between 40 and 12,000 characters." }, 400);
      }
      job = { description: pastedDescription };
    }
    if (!getOpenRouterClient()) return reply({ error: "Resume matching is temporarily unavailable. Please try again later." }, 503);
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      assertResumeUploadAllowed({ size: file.size, mime: file.type, filename: file.name, head: buffer.subarray(0, 8) });
    } catch {
      return reply({ error: "The file does not match a supported resume format." }, 400);
    }
    if (/\.docx$/i.test(file.name)) {
      try {
        assertSafeDocxArchive(buffer);
      } catch {
        return reply({ error: "The DOCX file is invalid or unsafe to process." }, 400);
      }
    }
    const text = await extractTextFromResumeBuffer(buffer, file.name);
    if (text.trim().length < 40) return reply({ error: "Could not read enough text. Try a text-based PDF, DOCX or TXT file." }, 422);
    let rate;
    try {
      rate = await checkResumeMatchRateLimits(clientIp);
    } catch {
      return reply({ error: "Resume matching is temporarily unavailable. Please try again later." }, 503);
    }
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many comparisons. Please wait before trying again." }, {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" },
      });
    }
    const result = await scoreResumeForJob({ resumeText: text, job });
    return reply(result);
  } catch {
    // Provider errors can contain resume text. Keep them out of public responses and logs.
    return reply({ error: "We could not complete this comparison. Please try again." }, 502);
  }
}
