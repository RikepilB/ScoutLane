import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { validateEgressUrl } from "@/lib/webhook/validate-egress-url";
import { encryptSecret } from "@/lib/security/integration-secrets";
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
  const body = await request.json();
  const { stageId, endpointUrl, apiKey, includeQuestions } = body;

  if (!stageId || !endpointUrl) {
    return NextResponse.json({ error: "stageId and endpointUrl are required" }, { status: 400 });
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

  let validatedEndpointUrl: string;
  try {
    validatedEndpointUrl = await validateEgressUrl(endpointUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid endpoint URL" },
      { status: 400 },
    );
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

  let integration;
  try {
    integration = await prisma.jobIntegration.create({
      data: {
        jobId,
        stageId,
        endpointUrl: validatedEndpointUrl,
        apiKey: encryptSecret(apiKey ?? ""),
        includeQuestions: includeQuestions ?? false,
        active: true,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("INTEGRATION_SECRETS_ENCRYPTION_KEY")) {
      return NextResponse.json({ error: "Integration secret encryption is not configured" }, { status: 503 });
    }
    throw error;
  }

  const { apiKey: _apiKey, ...safeIntegration } = integration;
  return NextResponse.json({ success: true, integration: safeIntegration }, { status: 201 });
}
