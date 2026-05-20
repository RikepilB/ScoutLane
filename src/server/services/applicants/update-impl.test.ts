// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    applicant: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  requireSession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: mocks.requireSession,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { deleteApplicantImpl } from "./update-impl";

beforeEach(() => {
  mocks.requireSession.mockReset();
  mocks.revalidatePath.mockReset();
  mocks.prisma.applicant.findUnique.mockReset();
  mocks.prisma.applicant.delete.mockReset();
});

describe("deleteApplicantImpl", () => {
  it("deletes applicants for admins in the same organization", async () => {
    mocks.requireSession.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
      organizationId: "org-1",
    });
    mocks.prisma.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      job: { organizationId: "org-1" },
    });

    await expect(deleteApplicantImpl("applicant-1")).resolves.toEqual({ jobId: "job-1" });

    expect(mocks.prisma.applicant.delete).toHaveBeenCalledWith({
      where: { id: "applicant-1" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants");
  });

  it("rejects non-admin users", async () => {
    mocks.requireSession.mockResolvedValue({
      id: "user-1",
      email: "recruiter@example.com",
      role: "RECRUITER",
      organizationId: "org-1",
    });

    await expect(deleteApplicantImpl("applicant-1")).rejects.toThrow(
      "Only admins can delete applicants",
    );
    expect(mocks.prisma.applicant.delete).not.toHaveBeenCalled();
  });

  it("does not delete applicants from another organization", async () => {
    mocks.requireSession.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
      organizationId: "org-1",
    });
    mocks.prisma.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      job: { organizationId: "org-2" },
    });

    await expect(deleteApplicantImpl("applicant-1")).rejects.toThrow("Applicant not found");
    expect(mocks.prisma.applicant.delete).not.toHaveBeenCalled();
  });
});
