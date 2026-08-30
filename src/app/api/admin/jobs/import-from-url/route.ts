import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { assertNotGuest } from "@/server/services/_lib/validate-session";
import { JobUrlFetchError, parseJobFromUrl } from "@/lib/jobs/parseJobFromUrl";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : null;
  if (!url) {
    return NextResponse.json({ error: "A URL is required" }, { status: 400 });
  }

  try {
    const parsed = await parseJobFromUrl(url);
    return NextResponse.json({ success: true, job: parsed });
  } catch (error) {
    if (error instanceof JobUrlFetchError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[import-from-url] failed:", error);
    return NextResponse.json({ error: "Could not import that job posting." }, { status: 500 });
  }
}
