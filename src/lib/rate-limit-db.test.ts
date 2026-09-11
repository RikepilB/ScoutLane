// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  transaction: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    rateLimitBucket: { deleteMany: mocks.deleteMany },
  },
}));

import {
  checkResumeMatchRateLimits,
  checkResumeMatchRequestRateLimits,
  deleteExpiredRateLimitBuckets,
} from "./rate-limit-db";

const originalVercelEnv = process.env.VERCEL_ENV;
const originalHashSecret = process.env.RATE_LIMIT_HASH_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VERCEL_ENV = "development";
  process.env.RATE_LIMIT_HASH_SECRET = "test-rate-limit-secret";
  mocks.queryRaw.mockResolvedValue([{ count: 1 }]);
  mocks.transaction.mockImplementation(async (callback) =>
    callback({ $queryRaw: mocks.queryRaw }),
  );
  mocks.deleteMany.mockResolvedValue({ count: 0 });
});

afterEach(() => {
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
  if (originalHashSecret === undefined) delete process.env.RATE_LIMIT_HASH_SECRET;
  else process.env.RATE_LIMIT_HASH_SECRET = originalHashSecret;
});

describe("checkResumeMatchRateLimits", () => {
  it("atomically consumes per-IP, global minute and global daily budgets", async () => {
    await expect(
      checkResumeMatchRateLimits("203.0.113.9", new Date("2026-09-11T04:05:00.000Z")),
    ).resolves.toEqual({ allowed: true, retryAfter: 0 });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.queryRaw).toHaveBeenCalledTimes(3);
    const serializedQueries = mocks.queryRaw.mock.calls
      .map(([query]) => JSON.stringify(query))
      .join(" ");
    expect(serializedQueries).not.toContain("203.0.113.9");
  });

  it("atomically bounds distributed request and document-parsing work", async () => {
    await expect(
      checkResumeMatchRequestRateLimits("203.0.113.12", new Date("2026-09-11T04:05:00.000Z")),
    ).resolves.toEqual({ allowed: true, retryAfter: 0 });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.queryRaw).toHaveBeenCalledTimes(3);
    const serializedQueries = mocks.queryRaw.mock.calls
      .map(([query]) => JSON.stringify(query))
      .join(" ");
    expect(serializedQueries).toContain("resume-match:request:global:day");
    expect(serializedQueries).not.toContain("203.0.113.12");
  });

  it("denies before AI processing when any shared budget is exhausted", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([]);

    const result = await checkResumeMatchRateLimits(
      "203.0.113.10",
      new Date("2026-09-11T04:05:30.000Z"),
    );

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2);
  });

  it("fails closed in production when the IP-hash secret is missing", async () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.RATE_LIMIT_HASH_SECRET;

    await expect(checkResumeMatchRateLimits("203.0.113.11")).rejects.toThrow(
      "Distributed rate limiting is not configured.",
    );
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });

  it("deletes counters once their true fixed window has expired", async () => {
    const now = new Date("2026-09-11T05:00:00.000Z");
    mocks.deleteMany.mockResolvedValue({ count: 4 });

    await expect(deleteExpiredRateLimitBuckets(now)).resolves.toBe(4);
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lte: now } } });
  });
});
