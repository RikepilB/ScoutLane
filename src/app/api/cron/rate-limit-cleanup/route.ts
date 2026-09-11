import { NextResponse } from "next/server";

import { deleteExpiredRateLimitBuckets } from "@/lib/rate-limit-db";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const deleted = await deleteExpiredRateLimitBuckets();
    return NextResponse.json(
      { ok: true, deleted },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Cleanup failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
