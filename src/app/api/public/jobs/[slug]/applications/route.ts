import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { canAcceptApplications } from "@/lib/jobs/status";
import { DUPLICATE_APPLICATION_MESSAGE } from "@/schemas/application";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ~10 application submissions per minute per IP. Shared across requests in this
// runtime instance; see src/lib/rate-limit.ts for production considerations.
const applicationRateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

const publicApplicationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(64, "First name too long")
    .regex(/^[a-zA-ZÀ-ÿ\-' ]+$/, "First name contains invalid characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(64, "Last name too long")
    .regex(/^[a-zA-ZÀ-ÿ\-' ]+$/, "Last name contains invalid characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(320, "Email too long"),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .max(20, "Phone too long")
    .regex(/^[+\d\s\-()]*$/, "Invalid phone format"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const rate = applicationRateLimiter.check(ip);
    if (!rate.allowed) {
      // Clamp to >=1s: time elapsed between the check and here can drive the
      // raw delta to zero or negative, which is an invalid Retry-After value.
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const { slug } = await params;

    const body = await request.json();
    const parsed = publicApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid application data" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const job = await prisma.job.findUnique({ where: { slug } });
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (!canAcceptApplications(job)) {
      return NextResponse.json({ success: false, error: "This position is not accepting applications." }, { status: 400 });
    }

    const existingApplicant = await prisma.applicant.findFirst({
      where: {
        jobId: job.id,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (existingApplicant) {
      return NextResponse.json(
        { success: false, field: "email", error: DUPLICATE_APPLICATION_MESSAGE },
        { status: 409 },
      );
    }

    if (body.resumeUrl) {
      return NextResponse.json(
        { success: false, error: "Direct resume URL upload is not supported. Please upload a file." },
        { status: 400 },
      );
    }

    const applicantName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    const applicant = await prisma.applicant.create({
      data: {
        jobId: job.id,
        name: applicantName,
        email,
        phone: parsed.data.phone,
        status: "NEW",
      },
    });

    return NextResponse.json(
      { success: true, applicant: { id: applicant.id, status: applicant.status } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const rate = applicationRateLimiter.check(ip);
    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    const job = await prisma.job.findUnique({ where: { slug } });
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (applicationId) {
      const applicant = await prisma.applicant.findUnique({
        where: { id: applicationId },
        select: { id: true, jobId: true, status: true },
      });

      if (!applicant || applicant.jobId !== job.id) {
        return NextResponse.json({ success: true, data: null });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: applicant.id,
          status: applicant.status,
          jobSlug: slug,
        },
      });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("Application load error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
