import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockRequireSession, mockRevalidatePath } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      job: { updateMany: fn() },
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

import { saveCustomFieldsImpl, updateJobImpl } from "./update-impl";

const user = { id: "u1", organizationId: "org-1", role: "ADMIN", email: "u@x.com" };

beforeEach(() => {
  mockRequireSession.mockReset();
  mockRevalidatePath.mockReset();
  prismaMock.job.updateMany.mockReset();
  mockRequireSession.mockResolvedValue(user);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateJobImpl", () => {
  it("scopes the update to the caller's org and returns not-found on 0 rows", async () => {
    prismaMock.job.updateMany.mockResolvedValue({ count: 0 });
    const result = await updateJobImpl("job-1", { title: "New title" });
    expect(prismaMock.job.updateMany).toHaveBeenCalledWith({
      where: { id: "job-1", organizationId: "org-1" },
      data: { title: "New title" },
    });
    expect(result).toEqual({ success: false, error: "Job not found" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates and returns success when the job is updated", async () => {
    prismaMock.job.updateMany.mockResolvedValue({ count: 1 });
    const result = await updateJobImpl("job-1", { title: "New title" });
    expect(result).toEqual({ success: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1");
  });
});

describe("saveCustomFieldsImpl", () => {
  it("rejects invalid custom fields without touching the DB", async () => {
    const result = await saveCustomFieldsImpl("job-1", [{ id: "f1" }]);
    expect(result.success).toBe(false);
    expect(prismaMock.job.updateMany).not.toHaveBeenCalled();
  });

  it("returns not-found on 0 rows updated", async () => {
    prismaMock.job.updateMany.mockResolvedValue({ count: 0 });
    const result = await saveCustomFieldsImpl("job-1", []);
    expect(result).toEqual({ success: false, error: "Job not found" });
  });

  it("saves valid custom fields scoped to the caller's org and revalidates", async () => {
    prismaMock.job.updateMany.mockResolvedValue({ count: 1 });
    const fields = [{ id: "f1", label: "Portfolio", type: "text", required: false }];
    const result = await saveCustomFieldsImpl("job-1", fields);
    expect(result).toEqual({ success: true });
    expect(prismaMock.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "job-1", organizationId: "org-1" } }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/form");
  });
});
