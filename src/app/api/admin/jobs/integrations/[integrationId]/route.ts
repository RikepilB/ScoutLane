import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { normalizeAssessmentQuestions } from "@/lib/jobs/assessment";
import { validateEgressUrl } from "@/lib/webhook/validate-egress-url";
import { decryptSecret } from "@/lib/security/integration-secrets";
import { assertNotGuest } from "@/server/services/_lib/validate-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { integrationId } = await params;
  const action = request.nextUrl.searchParams.get("action");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  try {
    assertNotGuest(user);
  } catch {
    return NextResponse.json({ error: "Guests have read-only access" }, { status: 403 });
  }

  const integration = await prisma.jobIntegration.findUnique({
    where: { id: integrationId },
    include: { job: { select: { organizationId: true, title: true, assessmentTitle: true, assessmentQuestions: true } } },
  });

  if (!integration || integration.job.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const apiKey = decryptSecret(integration.apiKey);

  try {
    await validateEgressUrl(integration.endpointUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid endpoint URL" },
      { status: 400 },
    );
  }

  if (action === "test") {
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      event: "stage_transition",
      timestamp: now,
      candidate: {
        id: "sample-applicant",
        name: "Sample Candidate",
        email: "sample@example.com",
        phone: "+1-555-0000",
        resumeUrl: "https://example.com/resume.pdf",
      },
    };

    if (integration.includeQuestions) {
      const questions = normalizeAssessmentQuestions(integration.job.assessmentQuestions);
      if (questions.length > 0) {
        payload.assessment = {
          title: integration.job.assessmentTitle ?? integration.job.title,
          description: "Please answer each question concisely.",
          questions,
        };
      }
    }

    try {
      const response = await fetch(integration.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      const responseText = (await response.text().catch(() => null))?.slice(0, 10000) ?? null;

      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          event: "integration_test",
          status: response.status,
          requestBody: JSON.stringify(payload).slice(0, 10000),
          responseBody: responseText,
        },
      });

      return NextResponse.json({ ok: true, status: response.status });
    } catch (error) {
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          event: "integration_test",
          status: 0,
          requestBody: JSON.stringify(payload).slice(0, 10000),
          responseBody: "Network error",
        },
      });
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
  }

  if (action === "retry") {
    const lastFailed = await prisma.integrationLog.findFirst({
      where: {
        integrationId: integration.id,
        event: "stage_transition",
        OR: [{ status: { gte: 400 } }, { status: 0 }],
      },
      orderBy: { createdAt: "desc" },
    });

    const last = lastFailed
      ? lastFailed
      : await prisma.integrationLog.findFirst({
          where: { integrationId: integration.id, event: "stage_transition" },
          orderBy: { createdAt: "desc" },
        });

    if (!last?.requestBody) {
      return NextResponse.json({ error: "No prior request to retry" }, { status: 400 });
    }

    try {
      const response = await fetch(integration.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: last.requestBody,
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      const responseText = (await response.text().catch(() => null))?.slice(0, 10000) ?? null;

      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          event: "integration_retry",
          status: response.status,
          requestBody: last.requestBody,
          responseBody: responseText,
        },
      });

      if (response.ok) {
        await prisma.jobIntegration.update({
          where: { id: integration.id },
          data: { lastSuccessAt: new Date(), failureCount: 0 },
        });
      } else {
        await prisma.jobIntegration.update({
          where: { id: integration.id },
          data: { lastFailureAt: new Date(), failureCount: { increment: 1 } },
        });
      }

      return NextResponse.json({ ok: true, status: response.status });
    } catch (error) {
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          event: "integration_retry",
          status: 0,
          requestBody: last.requestBody,
          responseBody: "Network error",
        },
      });
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { integrationId } = await params;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  try {
    assertNotGuest(user);
  } catch {
    return NextResponse.json({ error: "Guests have read-only access" }, { status: 403 });
  }

  const integration = await prisma.jobIntegration.findUnique({
    where: { id: integrationId },
    include: { job: { select: { organizationId: true } } },
  });

  if (!integration || integration.job.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  await prisma.jobIntegration.delete({ where: { id: integrationId } });

  return NextResponse.json({ success: true });
}
