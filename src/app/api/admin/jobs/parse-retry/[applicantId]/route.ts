import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { enqueueResumeParse } from "@/lib/queue/resume";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { applicantId } = await params;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { job: { select: { organizationId: true } } },
  });

  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  if (!applicant.resumeUrl) {
    return NextResponse.json({ error: "No resume on file" }, { status: 400 });
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { parsingStatus: "PENDING" },
  });

  try {
    const jobId = await enqueueResumeParse(applicantId, applicant.resumeUrl);
    return NextResponse.json({ success: true, status: "PENDING", jobId });
  } catch (error) {
    console.error("Failed to enqueue resume parse retry:", error);
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { parsingStatus: "FAILED" },
    });
    return NextResponse.json({ success: false, status: "FAILED" }, { status: 500 });
  }
}
