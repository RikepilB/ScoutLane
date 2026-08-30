import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { assertNotGuest } from "@/server/services/_lib/validate-session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ruleId } = await params;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  try {
    assertNotGuest(user);
  } catch {
    return NextResponse.json({ error: "Guests have read-only access" }, { status: 403 });
  }

  const rule = await prisma.autoAdvanceRule.findUnique({
    where: { id: ruleId },
    include: { job: { select: { organizationId: true } } },
  });

  if (!rule || rule.job.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  await prisma.autoAdvanceRule.delete({ where: { id: ruleId } });

  return NextResponse.json({ success: true });
}
