import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockRequireSession, mockRevalidatePath } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      job: { deleteMany: fn() },
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

import { deleteJob } from "./delete";

beforeEach(() => {
  mockRequireSession.mockReset();
  mockRevalidatePath.mockReset();
  prismaMock.job.deleteMany.mockReset();
  mockRequireSession.mockResolvedValue({ id: "u1", organizationId: "org-1", role: "ADMIN" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("deleteJob", () => {
  it("scopes the delete to the caller's org", async () => {
    prismaMock.job.deleteMany.mockResolvedValue({ count: 1 });
    await deleteJob("job-1");
    expect(prismaMock.job.deleteMany).toHaveBeenCalledWith({
      where: { id: "job-1", organizationId: "org-1" },
    });
  });

  it("returns not-found without revalidating when 0 rows deleted (cross-org id)", async () => {
    prismaMock.job.deleteMany.mockResolvedValue({ count: 0 });
    const result = await deleteJob("job-other-org");
    expect(result).toEqual({ success: false, error: "Job not found" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates the jobs list and returns success", async () => {
    prismaMock.job.deleteMany.mockResolvedValue({ count: 1 });
    const result = await deleteJob("job-1");
    expect(result).toEqual({ success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs");
  });
});
