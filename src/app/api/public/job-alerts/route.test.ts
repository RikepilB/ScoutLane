// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { subscribeMock } = vi.hoisted(() => ({
  subscribeMock: vi.fn(),
}));

vi.mock("@/server/services/job-alerts", () => ({
  subscribe: subscribeMock,
  unsubscribe: vi.fn(),
}));

import { POST } from "@/app/api/public/job-alerts/route";

beforeEach(() => {
  subscribeMock.mockReset();
  subscribeMock.mockResolvedValue({ success: true, message: "Subscribed!" });
});

afterEach(() => {
  vi.clearAllMocks();
});

function postFrom(ip: string) {
  const request = new Request("http://localhost/api/public/job-alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email: "ada@example.com" }),
  }) as unknown as NextRequest;

  return POST(request);
}

describe("POST /api/public/job-alerts", () => {
  it("allows requests under the per-IP limit", async () => {
    const response = await postFrom("203.0.113.10");
    expect(response.status).toBe(200);
    expect(subscribeMock).toHaveBeenCalledWith("ada@example.com");
  });

  it("returns 429 with Retry-After once an IP exceeds the limit", async () => {
    const ip = "203.0.113.20";
    for (let i = 0; i < 10; i++) {
      const ok = await postFrom(ip);
      expect(ok.status).toBe(200);
    }

    const limited = await postFrom(ip);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
    const body = (await limited.json()) as { error: string };
    expect(body.error).toMatch(/too many requests/i);
  });

  it("tracks limits independently per IP", async () => {
    const ip = "203.0.113.30";
    for (let i = 0; i < 10; i++) {
      await postFrom(ip);
    }
    await postFrom(ip); // exhausts this IP

    const otherIp = await postFrom("203.0.113.31");
    expect(otherIp.status).toBe(200);
  });
});
