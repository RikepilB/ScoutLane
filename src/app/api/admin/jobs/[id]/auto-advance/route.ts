import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { assertNotGuest } from "@/server/services/_lib/validate-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const body = await request.json().catch(() => null);
  const sourceStageId = body?.sourceStageId;
  const targetStageId = body?.targetStageId;
  const thresholdScore = body?.thresholdScore;

  if (!sourceStageId || !targetStageId) {
    return NextResponse.json({ error: "sourceStageId and targetStageId are required" }, { status: 400 });
  }
  if (sourceStageId === targetStageId) {
    return NextResponse.json({ error: "Source and target stage must be different" }, { status: 400 });
  }
  if (typeof thresholdScore !== "number" || Number.isNaN(thresholdScore) || thresholdScore < 0 || thresholdScore > 1) {
    return NextResponse.json({ error: "thresholdScore must be a number between 0 and 1" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  try {
    assertNotGuest(user);
  } catch {
    return NextResponse.json({ error: "Guests have read-only access" }, { status: 403 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: user.organizationId },
    select: {
      stages: { where: { id: { in: [sourceStageId, targetStageId] } }, select: { id: true, order: true } },
    },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const sourceStage = job.stages.find((s) => s.id === sourceStageId);
  const targetStage = job.stages.find((s) => s.id === targetStageId);
  if (!sourceStage || !targetStage) {
    return NextResponse.json({ error: "Stage not found on this job" }, { status: 404 });
  }
  if (targetStage.order <= sourceStage.order) {
    return NextResponse.json(
      { error: "Target stage must come after the source stage in the pipeline order" },
      { status: 400 },
    );
  }

  try {
    const rule = await prisma.autoAdvanceRule.create({
      data: { jobId, sourceStageId, targetStageId, thresholdScore, active: true },
    });
    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "An auto-advance rule already exists for that source stage" },
        { status: 409 },
      );
    }
    throw error;
  }
}
