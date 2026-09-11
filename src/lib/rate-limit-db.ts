import { createHmac } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

type Budget = {
  key: string;
  limit: number;
  windowMs: number;
};

class RateLimitDenied extends Error {
  constructor(readonly retryAfter: number) {
    super("Rate limit exhausted.");
  }
}

const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function rateLimitSecret() {
  const secret = process.env.RATE_LIMIT_HASH_SECRET;

  if (!secret && process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development") {
    throw new Error("Distributed rate limiting is not configured.");
  }

  return secret ?? "scoutlane-local-rate-limit-only";
}

function hashedClientKey(ip: string) {
  return createHmac("sha256", rateLimitSecret()).update(ip).digest("hex");
}

async function consumeBudget(
  transaction: Prisma.TransactionClient,
  budget: Budget,
  now: Date,
): Promise<RateLimitResult> {
  const windowStartMs = Math.floor(now.getTime() / budget.windowMs) * budget.windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + budget.windowMs);

  const rows = await transaction.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count", "expiresAt")
    VALUES (${budget.key}, ${windowStart}, 1, ${expiresAt})
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET
      "count" = "RateLimitBucket"."count" + 1,
      "expiresAt" = EXCLUDED."expiresAt"
    WHERE "RateLimitBucket"."count" < ${budget.limit}
    RETURNING "count"
  `);

  return {
    allowed: rows.length > 0,
    retryAfter: Math.max(1, Math.ceil((windowStartMs + budget.windowMs - now.getTime()) / 1000)),
  };
}

export async function checkResumeMatchRateLimits(
  ip: string,
  now = new Date(),
): Promise<RateLimitResult> {
  const clientKey = hashedClientKey(ip);
  return consumeBudgets([
    { key: "resume-match:global:day", limit: 100, windowMs: ONE_DAY_MS },
    { key: "resume-match:global:minute", limit: 12, windowMs: ONE_MINUTE_MS },
    { key: `resume-match:ip:${clientKey}`, limit: 5, windowMs: TEN_MINUTES_MS },
  ], now);
}

export async function checkResumeMatchRequestRateLimits(
  ip: string,
  now = new Date(),
): Promise<RateLimitResult> {
  const clientKey = hashedClientKey(ip);
  return consumeBudgets([
    { key: "resume-match:request:global:day", limit: 500, windowMs: ONE_DAY_MS },
    { key: "resume-match:request:global:minute", limit: 30, windowMs: ONE_MINUTE_MS },
    { key: `resume-match:request:ip:${clientKey}`, limit: 10, windowMs: ONE_MINUTE_MS },
  ], now);
}

async function consumeBudgets(budgets: Budget[], now: Date): Promise<RateLimitResult> {
  try {
    await prisma.$transaction(async (transaction) => {
      for (const budget of budgets) {
        const result = await consumeBudget(transaction, budget, now);
        if (!result.allowed) throw new RateLimitDenied(result.retryAfter);
      }
    });
  } catch (error) {
    if (error instanceof RateLimitDenied) {
      return { allowed: false, retryAfter: error.retryAfter };
    }
    throw error;
  }

  return { allowed: true, retryAfter: 0 };
}

export async function deleteExpiredRateLimitBuckets(now = new Date()): Promise<number> {
  const result = await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: now } } });
  return result.count;
}
