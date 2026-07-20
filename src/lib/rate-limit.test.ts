import { describe, it, expect } from "vitest";
import { clientIpFromHeaders, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit within the window", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => now });
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(false);
  });

  it("reports remaining count", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => now });
    expect(limiter.check("ip-a").remaining).toBe(1);
    expect(limiter.check("ip-a").remaining).toBe(0);
  });

  it("isolates counters per key", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-b").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(false);
  });

  it("resets after the window elapses", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    expect(limiter.check("ip-a").allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(false);
    now = 1001;
    expect(limiter.check("ip-a").allowed).toBe(true);
  });

  it("evicts expired counters while checking another key", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    limiter.check("expired-ip");
    now = 1000;
    limiter.check("active-ip");
    expect(limiter.check("expired-ip").allowed).toBe(true);
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers the platform-provided Vercel client IP", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.7",
      "x-forwarded-for": "spoofed, 198.51.100.2",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.7");
  });

  it("uses the final forwarded hop as a fallback", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "spoofed, 198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
  });
});
