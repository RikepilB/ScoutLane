import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const body = await request.json();
  const { stageId, endpointUrl, apiKey, includeQuestions } = body;

  if (!stageId || !endpointUrl) {
    return NextResponse.json({ error: "stageId and endpointUrl are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId: user.organizationId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId, jobId },
    select: { id: true },
  });
  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const integration = await prisma.jobIntegration.create({
    data: {
      jobId,
      stageId,
      endpointUrl,
      apiKey: apiKey ?? "",
      includeQuestions: includeQuestions ?? false,
      active: true,
    },
  });

  return NextResponse.json({ success: true, integration }, { status: 201 });
}
