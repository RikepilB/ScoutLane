// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      applicant: { findFirst: fn() },
    },
    mockAuth: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));

import { authorizeResumeRequest, resumeObjectBelongsToOrg } from "@/lib/resume/access";

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { email: "admin@scoutlane.local" } });
  prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1" });
  prismaMock.applicant.findFirst.mockResolvedValue({ id: "a1" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("resumeObjectBelongsToOrg", () => {
  it("matches the canonical /api/resumes/<objectName> resumeUrl scoped to the org", async () => {
    await resumeObjectBelongsToOrg("resumes/2026-06/ada-uuid.pdf", "org-1");

    expect(prismaMock.applicant.findFirst).toHaveBeenCalledWith({
      where: {
        resumeUrl: "/api/resumes/resumes/2026-06/ada-uuid.pdf",
        job: { is: { organizationId: "org-1" } },
      },
      select: { id: true },
    });
  });

  it("returns true when a matching applicant exists, false otherwise", async () => {
    prismaMock.applicant.findFirst.mockResolvedValueOnce({ id: "a1" });
    expect(await resumeObjectBelongsToOrg("obj.pdf", "org-1")).toBe(true);

    prismaMock.applicant.findFirst.mockResolvedValueOnce(null);
    expect(await resumeObjectBelongsToOrg("obj.pdf", "org-1")).toBe(false);
  });

  it("rejects empty object name or org without querying", async () => {
    expect(await resumeObjectBelongsToOrg("", "org-1")).toBe(false);
    expect(await resumeObjectBelongsToOrg("obj.pdf", "")).toBe(false);
    expect(prismaMock.applicant.findFirst).not.toHaveBeenCalled();
  });
});

describe("authorizeResumeRequest", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const result = await authorizeResumeRequest("obj.pdf");
    expect(result).toEqual({ ok: false, status: 401, error: "Not authenticated" });
    expect(prismaMock.applicant.findFirst).not.toHaveBeenCalled();
  });

  it("returns 403 when the user has no organization", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ organizationId: null });
    const result = await authorizeResumeRequest("obj.pdf");
    expect(result).toEqual({ ok: false, status: 403, error: "Not authorized" });
    expect(prismaMock.applicant.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the resume is not owned by the user's organization", async () => {
    prismaMock.applicant.findFirst.mockResolvedValueOnce(null);
    const result = await authorizeResumeRequest("obj.pdf");
    expect(result).toEqual({ ok: false, status: 404, error: "Resume file not found." });
  });

  it("returns ok with the organizationId when authorized and owned", async () => {
    const result = await authorizeResumeRequest("obj.pdf");
    expect(result).toEqual({ ok: true, organizationId: "org-1" });
  });
});
