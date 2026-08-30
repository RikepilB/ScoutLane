import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { canAcceptApplications } from "@/lib/jobs/status";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";
import { extractTextFromResumeBuffer } from "@/lib/resume/extractText";
import { assertResumeUploadAllowed } from "@/lib/storage/upload-limits";
import { parseResumeFromText } from "@/lib/llm/resume";
import { scoreApplicantForJob } from "@/lib/match/scoreApplicant";

// Costs an LLM call (or two — parse then score), unauthenticated: keep this tighter
// than the job-alerts subscribe limiter (10/min).
const fitCheckRateLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = clientIpFromHeaders(request.headers);
  const rate = fitCheckRateLimiter.check(ip);
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: {
      published: true,
      archived: true,
      description: true,
      whatYouWillDo: true,
      requirements: true,
      toolsAndSkills: true,
    },
  });
  if (!job || !canAcceptApplications(job)) {
    return NextResponse.json({ error: "This position is not accepting applications." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const resumeFile = formData?.get("resumeFile");
  if (!(resumeFile instanceof File)) {
    return NextResponse.json({ error: "A resume file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await resumeFile.arrayBuffer());

  try {
    assertResumeUploadAllowed({
      size: buffer.byteLength,
      mime: resumeFile.type,
      filename: resumeFile.name,
      head: buffer.subarray(0, 8),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    const text = await extractTextFromResumeBuffer(buffer, resumeFile.name);
    const parsedResume = await parseResumeFromText(text);
    const result = await scoreApplicantForJob({
      jobDescription: job.description,
      parsedResume,
      structuredSections: {
        whatYouWillDo: job.whatYouWillDo,
        requirements: job.requirements,
        toolsAndSkills: job.toolsAndSkills,
      },
    });

    return NextResponse.json({
      score: result.score,
      matchedSkills: result.matchedSkills,
      rationale: result.rationale,
    });
  } catch (error) {
    console.error("[fit-check] failed:", error);
    return NextResponse.json({ error: "Could not check your fit right now." }, { status: 500 });
  }
}
