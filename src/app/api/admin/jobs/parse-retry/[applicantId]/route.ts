import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

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

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { parsingStatus: "PENDING" },
  });

  const { parseResumeWithGemini } = await import("@/lib/llm/resume");

  try {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { parsingStatus: "PARSING" },
    });

    const response = await fetch(applicant.resumeUrl!);
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer);
    const parsed = await parseResumeWithGemini(text.slice(0, 10000));

    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        parsedData: parsed,
        parsingStatus: "COMPLETED",
        data: {
          education: parsed.education.map((e) => ({
            institution: e.institution,
            degree: e.degree,
            field: e.fieldOfStudy,
            graduationYear: e.graduationYear,
          })),
          work: parsed.workHistory.map((w) => ({
            company: w.company,
            title: w.jobTitle,
            duration: w.duration,
          })),
          skills: parsed.skills,
        },
      },
    });

    return NextResponse.json({ success: true, status: "COMPLETED" });
  } catch {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { parsingStatus: "FAILED" },
    });
    return NextResponse.json({ success: false, status: "FAILED" }, { status: 500 });
  }
}
