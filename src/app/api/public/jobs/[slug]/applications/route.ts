import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const job = await prisma.job.findUnique({ where: { slug } });
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const { firstName, lastName, email, phone, resumeUrl, status } = body;
    const name = `${firstName} ${lastName}`.trim();

    const applicant = await prisma.applicant.create({
      data: {
        jobId: job.id,
        name,
        email,
        phone,
        resumeUrl: resumeUrl || null,
        status: body._draft ? "NEW" : "NEW",
      },
    });

    return NextResponse.json(
      { success: true, applicant: { id: applicant.id, name: applicant.name, email: applicant.email, status: applicant.status } },
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
      });

      if (!applicant || applicant.jobId !== job.id) {
        return NextResponse.json({ success: true, data: null });
      }

      return NextResponse.json({
        success: true,
        data: {
          firstName: applicant.name.split(" ")[0] || "",
          lastName: applicant.name.split(" ").slice(1).join(" ") || "",
          email: applicant.email || "",
          phone: applicant.phone || "",
          resumeUrl: applicant.resumeUrl || "",
          customFields: [],
          status: "submitted",
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
