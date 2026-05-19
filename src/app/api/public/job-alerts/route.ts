import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subscribe, unsubscribe } from "@/server/services/job-alerts";

const schema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const result = await subscribe(body.data.email);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const success = await unsubscribe(token);
  if (success) {
    return NextResponse.redirect(new URL("/?unsubscribed=1", request.url));
  }
  return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
}
