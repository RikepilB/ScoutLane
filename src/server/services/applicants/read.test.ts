import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockRequireSession } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      applicant: { findMany: fn(), count: fn(), findUnique: fn() },
    },
    mockRequireSession: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: mockRequireSession,
}));

import { getApplicantDetail, getApplicants } from "./read";

const user = { id: "u1", organizationId: "org-1", role: "GUEST", email: "u@x.com" };

beforeEach(() => {
  mockRequireSession.mockReset();
  prismaMock.applicant.findMany.mockReset();
  prismaMock.applicant.count.mockReset();
  prismaMock.applicant.findUnique.mockReset();
  mockRequireSession.mockResolvedValue(user);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getApplicants", () => {
  it("allows GUEST role (read-only access)", async () => {
    prismaMock.applicant.findMany.mockResolvedValue([]);
    prismaMock.applicant.count.mockResolvedValue(0);
    await getApplicants({ jobId: "job-1" });
    expect(mockRequireSession).toHaveBeenCalledWith({ allowGuest: true });
  });

  it("scopes the query to the caller's organization", async () => {
    prismaMock.applicant.findMany.mockResolvedValue([]);
    prismaMock.applicant.count.mockResolvedValue(0);
    await getApplicants({ jobId: "job-1" });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: "job-1", job: { organizationId: "org-1" } },
      }),
    );
  });

  it("adds a case-insensitive name/email OR filter when searching", async () => {
    prismaMock.applicant.findMany.mockResolvedValue([]);
    prismaMock.applicant.count.mockResolvedValue(0);
    await getApplicants({ jobId: "job-1", search: "ada" });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: "ada", mode: "insensitive" } },
            { email: { contains: "ada", mode: "insensitive" } },
          ],
        }),
      }),
    );
  });

  it("filters by status unless status is 'all'", async () => {
    prismaMock.applicant.findMany.mockResolvedValue([]);
    prismaMock.applicant.count.mockResolvedValue(0);
    await getApplicants({ jobId: "job-1", status: "NEW" });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "NEW" }) }),
    );

    prismaMock.applicant.findMany.mockClear();
    await getApplicants({ jobId: "job-1", status: "all" });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ status: expect.anything() }),
      }),
    );
  });

  it("sorts by the given field/order, defaulting to createdAt desc", async () => {
    prismaMock.applicant.findMany.mockResolvedValue([]);
    prismaMock.applicant.count.mockResolvedValue(0);
    await getApplicants({ jobId: "job-1" });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );

    prismaMock.applicant.findMany.mockClear();
    await getApplicants({ jobId: "job-1", sortBy: "score", sortOrder: "asc" });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { score: "asc" } }),
    );
  });

  it("returns applicants and total count together", async () => {
    prismaMock.applicant.findMany.mockResolvedValue([{ id: "a1" }]);
    prismaMock.applicant.count.mockResolvedValue(1);
    const result = await getApplicants({ jobId: "job-1" });
    expect(result).toEqual({ applicants: [{ id: "a1" }], total: 1 });
  });
});

describe("getApplicantDetail", () => {
  it("returns null when the applicant doesn't exist", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue(null);
    const result = await getApplicantDetail("app-1");
    expect(result).toBeNull();
  });

  it("returns null when the applicant is in another org (no leak)", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      id: "app-1",
      job: { organizationId: "org-2" },
    });
    const result = await getApplicantDetail("app-1");
    expect(result).toBeNull();
  });

  it("returns the applicant when owned by the caller's org", async () => {
    const applicant = { id: "app-1", job: { organizationId: "org-1" } };
    prismaMock.applicant.findUnique.mockResolvedValue(applicant);
    const result = await getApplicantDetail("app-1");
    expect(result).toBe(applicant);
  });
});
