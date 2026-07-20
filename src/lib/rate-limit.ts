/**
 * In-memory fixed-window rate limiter.
 *
 * Acceptable for a single-instance take-home deployment. Production behind
 * multiple instances would back this with a shared store (Upstash Redis / Vercel
 * KV) so counters survive across processes and cold starts.
 */

type RateLimiterOptions = {
  /** Max allowed requests per key within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Injectable clock for testing. Defaults to Date.now. */
  now?: () => number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Counter = { count: number; resetAt: number };

/** Sweep stale counters every N checks instead of on every single request. */
const SWEEP_INTERVAL = 128;

export function createRateLimiter(options: RateLimiterOptions) {
  const { limit, windowMs } = options;
  const now = options.now ?? Date.now;
  const counters = new Map<string, Counter>();
  let checksSinceSweep = 0;

  return {
    check(key: string): RateLimitResult {
      const t = now();
      checksSinceSweep += 1;
      if (checksSinceSweep >= SWEEP_INTERVAL) {
        checksSinceSweep = 0;
        for (const [counterKey, counter] of counters) {
          if (t >= counter.resetAt) counters.delete(counterKey);
        }
      }
      const existing = counters.get(key);

      if (!existing || t >= existing.resetAt) {
        const resetAt = t + windowMs;
        counters.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: limit - 1, resetAt };
      }

      if (existing.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt };
      }

      existing.count += 1;
      return {
        allowed: true,
        remaining: limit - existing.count,
        resetAt: existing.resetAt,
      };
    },
  };
}

/** Minimal header accessor — satisfied by both `Headers` and Next's `ReadonlyHeaders`. */
type HeaderGetter = { get(name: string): string | null };

/** Extract a best-effort client IP from request headers. */
export function clientIpFromHeaders(headers: HeaderGetter): string {
  const vercelForwarded = headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)?.trim() || "unknown";
  return "unknown";
}
