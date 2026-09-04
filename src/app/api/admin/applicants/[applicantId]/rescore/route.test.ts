// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth, mockScoreApplicantInline, mockRevalidatePath } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      applicant: { findUnique: fn() },
    },
    mockAuth: fn(),
    mockScoreApplicantInline: fn(),
    mockRevalidatePath: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/match/scoreApplicant", () => ({ scoreApplicantInline: mockScoreApplicantInline }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { NextRequest } from "next/server";
function req() {
  return new NextRequest("http://x", { method: "POST" });
}

import { POST } from "./route";

const ctx = { params: Promise.resolve({ applicantId: "app-1" }) };

beforeEach(() => {
  mockAuth.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.applicant.findUnique.mockReset();
  mockScoreApplicantInline.mockReset();
  mockRevalidatePath.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/applicants/[applicantId]/rescore", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(req(), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a GUEST role", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 404 when the applicant is in a different org", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    prismaMock.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      parsedData: { skills: [] },
      job: { organizationId: "org-2" },
    });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 400 when the resume hasn't been parsed", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    prismaMock.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      parsedData: null,
      job: { organizationId: "org-1" },
    });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(400);
    expect(mockScoreApplicantInline).not.toHaveBeenCalled();
  });

  it("scores, revalidates, and returns the updated score on success", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    prismaMock.applicant.findUnique
      .mockResolvedValueOnce({
        jobId: "job-1",
        parsedData: { skills: ["ts"] },
        job: { organizationId: "org-1" },
      })
      .mockResolvedValueOnce({ score: 87 });
    mockScoreApplicantInline.mockResolvedValue(undefined);

    const res = await POST(req(), ctx);
    expect(res.status).toBe(200);
    expect(mockScoreApplicantInline).toHaveBeenCalledWith("app-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/pipeline");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants");
    await expect(res.json()).resolves.toEqual({ success: true, score: 87 });
  });

  it("returns 500 when scoring throws", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    prismaMock.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      parsedData: { skills: [] },
      job: { organizationId: "org-1" },
    });
    mockScoreApplicantInline.mockRejectedValue(new Error("boom"));

    const res = await POST(req(), ctx);
    expect(res.status).toBe(500);
  });
});
