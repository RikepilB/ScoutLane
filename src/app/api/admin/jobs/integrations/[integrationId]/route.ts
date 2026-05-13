import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

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
