import { describe, expect, it } from "vitest";
import { computeConversionFunnel } from "./conversionFunnel";

const stages = [
  { id: "s0", name: "New", order: 0 },
  { id: "s1", name: "Screening", order: 1 },
  { id: "s2", name: "Interview", order: 2 },
  { id: "s3", name: "Offer", order: 3 },
];

describe("computeConversionFunnel", () => {
  it("returns zeroed stages when there are no applicants", () => {
    const result = computeConversionFunnel(stages, [], []);
    expect(result.every((r) => r.count === 0 && r.percentOfTotal === 0)).toBe(true);
    expect(result).toHaveLength(4);
  });

  it("treats unassigned applicants (null pipelineStageId) as reaching the first stage", () => {
    const result = computeConversionFunnel(stages, [{ id: "a1", pipelineStageId: null }], []);
    expect(result.find((r) => r.stageId === "s0")?.count).toBe(1);
    expect(result.find((r) => r.stageId === "s1")?.count).toBe(0);
  });

  it("is monotonic: an applicant currently at a later stage counts for every earlier stage too", () => {
    const result = computeConversionFunnel(stages, [{ id: "a1", pipelineStageId: "s2" }], []);
    expect(result.find((r) => r.stageId === "s0")?.count).toBe(1);
    expect(result.find((r) => r.stageId === "s1")?.count).toBe(1);
    expect(result.find((r) => r.stageId === "s2")?.count).toBe(1);
    expect(result.find((r) => r.stageId === "s3")?.count).toBe(0);
  });

  it("uses transition history, not just current stage, for the furthest-reached calculation", () => {
    // Applicant is currently back at Screening (e.g. a re-review) but history shows
    // they once reached Interview — the funnel should still credit Interview.
    const result = computeConversionFunnel(
      stages,
      [{ id: "a1", pipelineStageId: "s1" }],
      [
        { applicantId: "a1", toStage: "Screening" },
        { applicantId: "a1", toStage: "Interview" },
        { applicantId: "a1", toStage: "Screening" },
      ],
    );
    expect(result.find((r) => r.stageId === "s2")?.count).toBe(1);
    expect(result.find((r) => r.stageId === "s3")?.count).toBe(0);
  });

  it("computes percentOfTotal correctly", () => {
    const applicants = [
      { id: "a1", pipelineStageId: "s3" },
      { id: "a2", pipelineStageId: "s0" },
      { id: "a3", pipelineStageId: "s0" },
      { id: "a4", pipelineStageId: "s0" },
    ];
    const result = computeConversionFunnel(stages, applicants, []);
    expect(result.find((r) => r.stageId === "s0")?.percentOfTotal).toBe(100);
    expect(result.find((r) => r.stageId === "s3")?.percentOfTotal).toBe(25);
  });

  it("ignores transitions to stage names that no longer exist (renamed/deleted stage)", () => {
    const result = computeConversionFunnel(
      stages,
      [{ id: "a1", pipelineStageId: "s0" }],
      [{ applicantId: "a1", toStage: "Some Deleted Stage" }],
    );
    expect(result.find((r) => r.stageId === "s3")?.count).toBe(0);
  });

  it("returns an empty array when there are no stages configured", () => {
    const result = computeConversionFunnel([], [{ id: "a1", pipelineStageId: null }], []);
    expect(result).toEqual([]);
  });
});
