import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subscribe, unsubscribe } from "@/server/services/job-alerts";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(254),
});

// ~10 subscribe attempts per minute per IP. Shared across requests in this
// runtime instance; see src/lib/rate-limit.ts for production considerations.
const jobAlertRateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const rate = jobAlertRateLimiter.check(ip);
    if (!rate.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

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
