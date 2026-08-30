// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    applicant: { findUnique: vi.fn() },
    autoAdvanceRule: { findUnique: vi.fn() },
  },
  moveApplicantFromWorker: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/server/services/pipeline/update-impl", () => ({
  moveApplicantFromWorker: mocks.moveApplicantFromWorker,
}));

import { maybeAutoAdvance } from "./scoreApplicant";

function seedRule(overrides: Partial<Record<string, unknown>> = {}) {
  mocks.prisma.autoAdvanceRule.findUnique.mockResolvedValue({
    active: true,
    targetStageId: "stage-target",
    thresholdScore: 0.7,
    sourceStage: { order: 1 },
    targetStage: { order: 2 },
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.moveApplicantFromWorker.mockResolvedValue({ success: true });
});

describe("maybeAutoAdvance", () => {
  it("does nothing when the applicant has no current stage", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: null });

    await maybeAutoAdvance("applicant-1", 0.9);

    expect(mocks.prisma.autoAdvanceRule.findUnique).not.toHaveBeenCalled();
    expect(mocks.moveApplicantFromWorker).not.toHaveBeenCalled();
  });

  it("does nothing when no rule targets the applicant's current stage", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-source" });
    mocks.prisma.autoAdvanceRule.findUnique.mockResolvedValue(null);

    await maybeAutoAdvance("applicant-1", 0.9);

    expect(mocks.prisma.autoAdvanceRule.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sourceStageId: "stage-source" } }),
    );
    expect(mocks.moveApplicantFromWorker).not.toHaveBeenCalled();
  });

  it("does nothing when the matching rule is inactive", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-source" });
    seedRule({ active: false });

    await maybeAutoAdvance("applicant-1", 0.9);

    expect(mocks.moveApplicantFromWorker).not.toHaveBeenCalled();
  });

  it("does nothing when the score is below the rule's threshold", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-source" });
    seedRule({ thresholdScore: 0.8 });

    await maybeAutoAdvance("applicant-1", 0.79);

    expect(mocks.moveApplicantFromWorker).not.toHaveBeenCalled();
  });

  it("does nothing when the target stage's order does not come after the source stage (misconfigured rule)", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-source" });
    seedRule({ sourceStage: { order: 3 }, targetStage: { order: 2 } });

    await maybeAutoAdvance("applicant-1", 0.9);

    expect(mocks.moveApplicantFromWorker).not.toHaveBeenCalled();
  });

  it("moves the applicant when the threshold is cleared and the target stage is later", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-source" });
    seedRule({ thresholdScore: 0.7, targetStageId: "stage-target" });

    await maybeAutoAdvance("applicant-1", 0.75);

    expect(mocks.moveApplicantFromWorker).toHaveBeenCalledWith("applicant-1", "stage-target");
  });

  it("is a no-op on a rescore after the applicant already advanced (rule keyed on current stage, not the original one)", async () => {
    // Applicant already moved out of "stage-source" into "stage-target" by a prior
    // auto-advance; no rule is configured with "stage-target" as its source.
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-target" });
    mocks.prisma.autoAdvanceRule.findUnique.mockResolvedValue(null);

    await maybeAutoAdvance("applicant-1", 0.95);

    expect(mocks.prisma.autoAdvanceRule.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sourceStageId: "stage-target" } }),
    );
    expect(mocks.moveApplicantFromWorker).not.toHaveBeenCalled();
  });

  it("never throws, even when the move itself fails", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({ pipelineStageId: "stage-source" });
    seedRule();
    mocks.moveApplicantFromWorker.mockRejectedValue(new Error("db down"));

    await expect(maybeAutoAdvance("applicant-1", 0.9)).resolves.toBeUndefined();
  });
});
