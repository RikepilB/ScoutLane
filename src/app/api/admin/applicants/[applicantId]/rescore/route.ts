import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { scoreApplicantInline } from "@/lib/match/scoreApplicant";
import { assertNotGuest } from "@/server/services/_lib/validate-session";

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
  try {
    assertNotGuest(user);
  } catch {
    return NextResponse.json({ error: "Guests have read-only access" }, { status: 403 });
  }

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { job: { select: { organizationId: true } } },
  });

  if (!applicant || applicant.job.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  if (!applicant.parsedData) {
    return NextResponse.json(
      { error: "Resume has not been parsed yet" },
      { status: 400 },
    );
  }

  try {
    await scoreApplicantInline(applicantId);
    const updated = await prisma.applicant.findUnique({
      where: { id: applicantId },
      select: { score: true },
    });
    return NextResponse.json({ success: true, score: updated?.score ?? null });
  } catch (error) {
    console.error("[rescore] failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
