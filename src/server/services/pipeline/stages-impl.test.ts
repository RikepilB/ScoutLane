import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockRequireSession, mockRevalidatePath } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      job: { findFirst: fn() },
      pipelineStage: {
        findFirst: fn(),
        findUnique: fn(),
        create: fn(),
        update: fn(),
        delete: fn(),
      },
      applicant: { updateMany: fn(), count: fn() },
    },
    mockRequireSession: fn(),
    mockRevalidatePath: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: mockRequireSession,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import {
  createStageImpl,
  deleteStageImpl,
  reorderStagesImpl,
  updateStageImpl,
} from "./stages-impl";

const user = { id: "u1", organizationId: "org-1", role: "ADMIN", email: "u@x.com" };

beforeEach(() => {
  mockRequireSession.mockReset();
  mockRevalidatePath.mockReset();
  prismaMock.job.findFirst.mockReset();
  prismaMock.pipelineStage.findFirst.mockReset();
  prismaMock.pipelineStage.findUnique.mockReset();
  prismaMock.pipelineStage.create.mockReset();
  prismaMock.pipelineStage.update.mockReset();
  prismaMock.pipelineStage.delete.mockReset();
  prismaMock.applicant.updateMany.mockReset();
  prismaMock.applicant.count.mockReset();
  mockRequireSession.mockResolvedValue(user);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createStageImpl", () => {
  it("throws when the job isn't in the caller's org", async () => {
    prismaMock.job.findFirst.mockResolvedValue(null);
    await expect(createStageImpl("job-1", "Interview")).rejects.toThrow("Job not found");
    expect(prismaMock.pipelineStage.create).not.toHaveBeenCalled();
  });

  it("appends the new stage at the end of the order", async () => {
    prismaMock.job.findFirst.mockResolvedValue({ id: "job-1" });
    prismaMock.pipelineStage.findFirst.mockResolvedValue({ order: 2 });

    await createStageImpl("job-1", "Interview");

    expect(prismaMock.pipelineStage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 3 }) }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/stages");
  });
});

describe("updateStageImpl", () => {
  it("throws when the stage belongs to another org", async () => {
    prismaMock.pipelineStage.findUnique.mockResolvedValue({
      job: { organizationId: "org-2" },
    });
    await expect(updateStageImpl("stage-1", { name: "X" })).rejects.toThrow("Stage not found");
    expect(prismaMock.pipelineStage.update).not.toHaveBeenCalled();
  });

  it("updates a stage owned by the caller's org", async () => {
    prismaMock.pipelineStage.findUnique.mockResolvedValue({
      job: { organizationId: "org-1" },
    });
    await updateStageImpl("stage-1", { name: "Renamed" });
    expect(prismaMock.pipelineStage.update).toHaveBeenCalledWith({
      where: { id: "stage-1" },
      data: { name: "Renamed" },
    });
  });
});

describe("deleteStageImpl", () => {
  it("throws when the stage belongs to another org", async () => {
    prismaMock.pipelineStage.findUnique.mockResolvedValue({
      job: { organizationId: "org-2" },
    });
    await expect(deleteStageImpl("stage-1")).rejects.toThrow("Stage not found");
  });

  it("reassigns applicants to the next stage by order when no target given", async () => {
    // Call order inside deleteStageImpl: assertStageAccess (findUnique), stage lookup
    // (findUnique), then the fallback target lookup (findFirst).
    prismaMock.pipelineStage.findUnique
      .mockResolvedValueOnce({ job: { organizationId: "org-1" } })
      .mockResolvedValueOnce({ name: "Screening", jobId: "job-1" });
    prismaMock.pipelineStage.findFirst.mockResolvedValue({ id: "stage-2", status: "REVIEWING" });
    prismaMock.applicant.updateMany.mockResolvedValue({ count: 3 });
    prismaMock.applicant.count.mockResolvedValue(3);

    const result = await deleteStageImpl("stage-1");

    expect(prismaMock.applicant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: "job-1", pipelineStageId: "stage-1" },
        data: expect.objectContaining({ pipelineStageId: "stage-2", status: "REVIEWING" }),
      }),
    );
    expect(prismaMock.pipelineStage.delete).toHaveBeenCalledWith({ where: { id: "stage-1" } });
    expect(result).toEqual({ success: true, applicantCount: 3 });
  });

  it("reassigns applicants to an explicit target stage", async () => {
    prismaMock.pipelineStage.findUnique
      .mockResolvedValueOnce({ job: { organizationId: "org-1" } }) // assertStageAccess
      .mockResolvedValueOnce({ name: "Screening", jobId: "job-1" }) // stage lookup
      .mockResolvedValueOnce({ status: "OFFERED" }); // target lookup
    prismaMock.applicant.count.mockResolvedValue(1);

    await deleteStageImpl("stage-1", "stage-9");

    expect(prismaMock.applicant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pipelineStageId: "stage-9", status: "OFFERED" }),
      }),
    );
  });
});

describe("reorderStagesImpl", () => {
  it("throws when any stage belongs to another org, without reordering later ones", async () => {
    prismaMock.pipelineStage.findUnique
      .mockResolvedValueOnce({ job: { organizationId: "org-1" } })
      .mockResolvedValueOnce({ job: { organizationId: "org-2" } });

    await expect(
      reorderStagesImpl([
        { id: "s1", order: 0 },
        { id: "s2", order: 1 },
      ]),
    ).rejects.toThrow("Stage not found");

    expect(prismaMock.pipelineStage.update).toHaveBeenCalledTimes(1);
  });

  it("updates order for every stage owned by the caller's org", async () => {
    prismaMock.pipelineStage.findUnique.mockResolvedValue({
      job: { organizationId: "org-1" },
    });

    await reorderStagesImpl([
      { id: "s1", order: 0 },
      { id: "s2", order: 1 },
    ]);

    expect(prismaMock.pipelineStage.update).toHaveBeenCalledTimes(2);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/[id]/stages");
  });
});
