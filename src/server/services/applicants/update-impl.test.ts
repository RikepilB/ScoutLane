// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    applicant: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
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

import { deleteApplicantImpl, updateApplicantTagsImpl } from "./update-impl";

beforeEach(() => {
  mocks.requireSession.mockReset();
  mocks.revalidatePath.mockReset();
  mocks.prisma.applicant.findUnique.mockReset();
  mocks.prisma.applicant.delete.mockReset();
  mocks.prisma.applicant.update.mockReset();
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

describe("updateApplicantTagsImpl", () => {
  beforeEach(() => {
    mocks.requireSession.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      role: "RECRUITER",
      organizationId: "org-1",
    });
    mocks.prisma.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      job: { organizationId: "org-1" },
    });
  });

  it("throws for a cross-org applicant", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      job: { organizationId: "org-2" },
    });
    await expect(updateApplicantTagsImpl("applicant-1", ["strong-yes"])).rejects.toThrow(
      "Applicant not found",
    );
    expect(mocks.prisma.applicant.update).not.toHaveBeenCalled();
  });

  it("trims, dedupes case-insensitively, and drops empty tags", async () => {
    mocks.prisma.applicant.update.mockResolvedValue({});
    const result = await updateApplicantTagsImpl("applicant-1", [
      "  Strong Yes  ",
      "strong yes",
      "",
      "  ",
      "Referral",
    ]);
    expect(result).toEqual(["Strong Yes", "Referral"]);
    expect(mocks.prisma.applicant.update).toHaveBeenCalledWith({
      where: { id: "applicant-1" },
      data: { tags: ["Strong Yes", "Referral"] },
    });
  });

  it("caps tag count and per-tag length", async () => {
    mocks.prisma.applicant.update.mockResolvedValue({});
    const manyTags = Array.from({ length: 30 }, (_, i) => `tag-${i}`);
    const result = await updateApplicantTagsImpl("applicant-1", manyTags);
    expect(result).toHaveLength(20);

    const longTag = "x".repeat(100);
    const result2 = await updateApplicantTagsImpl("applicant-1", [longTag]);
    expect(result2[0]).toHaveLength(40);
  });

  it("revalidates both the detail and list paths", async () => {
    mocks.prisma.applicant.update.mockResolvedValue({});
    await updateApplicantTagsImpl("applicant-1", ["referral"]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants/applicant-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants");
  });
});
