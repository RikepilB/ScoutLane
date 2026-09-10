import { describe, expect, it } from "vitest";
import { buildApplicantTrend, getUtcTrendStart } from "./dashboard-trend";

describe("dashboard trend window", () => {
  const now = new Date("2026-09-10T22:45:00.000Z");

  it("starts at midnight UTC thirteen days before today", () => {
    expect(getUtcTrendStart(now)).toEqual(new Date("2026-08-28T00:00:00.000Z"));
  });

  it("always returns exactly fourteen ordered calendar buckets", () => {
    const trend = buildApplicantTrend(
      now,
      [
        { dateKey: "2026-08-27", count: 99 },
        { dateKey: "2026-08-28", count: 2 },
        { dateKey: "2026-09-10", count: 4 },
      ],
    );

    expect(trend).toHaveLength(14);
    expect(trend[0]).toEqual({ date: "Aug 28", count: 2 });
    expect(trend[13]).toEqual({ date: "Sep 10", count: 4 });
    expect(trend).not.toContainEqual({ date: "Aug 27", count: 99 });
  });
});
