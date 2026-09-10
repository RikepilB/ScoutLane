import { describe, expect, it } from "vitest";
import { buildHiringInsight } from "./dashboard-insight";

describe("buildHiringInsight", () => {
  it("summarizes weekly volume and the busiest stage", () => {
    expect(
      buildHiringInsight({
        newApplicantsThisWeek: 32,
        stageDistribution: [
          { status: "INTERVIEW", count: 44 },
          { status: "NEW", count: 76 },
        ],
      }),
    ).toBe("32 new applicants this week. New is the busiest stage with 76 candidates.");
  });

  it("uses singular nouns for one applicant", () => {
    expect(
      buildHiringInsight({
        newApplicantsThisWeek: 1,
        stageDistribution: [{ status: "SHORTLISTED", count: 1 }],
      }),
    ).toBe("1 new applicant this week. Shortlisted is the busiest stage with 1 candidate.");
  });

  it("uses a deterministic alphabetical tie-break for equally busy stages", () => {
    expect(
      buildHiringInsight({
        newApplicantsThisWeek: 3,
        stageDistribution: [
          { status: "REVIEWING", count: 2 },
          { status: "NEW", count: 2 },
        ],
      }),
    ).toBe("3 new applicants this week. New is the busiest stage with 2 candidates.");
  });

  it("gives a useful empty state instead of fabricated insight", () => {
    expect(
      buildHiringInsight({
        newApplicantsThisWeek: 0,
        stageDistribution: [],
      }),
    ).toBe("No applicants yet. Your hiring record will build as candidates apply.");
  });
});
