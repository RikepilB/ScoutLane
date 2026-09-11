// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cleanup: vi.fn() }));

vi.mock("@/lib/rate-limit-db", () => ({ deleteExpiredRateLimitBuckets: mocks.cleanup }));

import { GET } from "./route";

const originalSecret = process.env.CRON_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "cron-test-secret";
  mocks.cleanup.mockResolvedValue(3);
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe("rate-limit cleanup cron", () => {
  it("rejects requests without the configured bearer secret", async () => {
    const response = await GET(new Request("http://localhost/api/cron/rate-limit-cleanup"));
    expect(response.status).toBe(401);
    expect(mocks.cleanup).not.toHaveBeenCalled();
  });

  it("deletes expired counters for an authenticated Vercel Cron request", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/rate-limit-cleanup", {
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, deleted: 3 });
  });
});
