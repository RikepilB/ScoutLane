import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./rate-limit";

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
});
