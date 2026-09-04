// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth, mockParseInline, mockDispatch } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      applicant: { findUnique: fn(), update: fn() },
    },
    mockAuth: fn(),
    mockParseInline: fn(),
    mockDispatch: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/resume/parseApplicantResume", () => ({
  parseApplicantResumeFromUrl: mockParseInline,
}));
vi.mock("@/server/jobs/dispatch", () => ({ dispatchResumeParse: mockDispatch }));

import { NextRequest } from "next/server";
import { POST } from "./route";

const ctx = { params: Promise.resolve({ applicantId: "app-1" }) };

function req(mode?: string) {
  const url = mode ? `http://x?mode=${mode}` : "http://x";
  return new NextRequest(url, { method: "POST" });
}

beforeEach(() => {
  mockAuth.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.applicant.findUnique.mockReset();
  prismaMock.applicant.update.mockReset();
  mockParseInline.mockReset();
  mockDispatch.mockReset();

  mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
  prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/jobs/parse-retry/[applicantId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(req(), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a GUEST role", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 404 for a cross-org applicant", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      resumeUrl: "resume.pdf",
      job: { organizationId: "org-2" },
    });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 400 when there's no resume on file", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      resumeUrl: null,
      job: { organizationId: "org-1" },
    });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(400);
  });

  it("dispatches to the queue by default (mode != inline)", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      resumeUrl: "resume.pdf",
      job: { organizationId: "org-1" },
    });
    mockDispatch.mockResolvedValue(undefined);

    const res = await POST(req(), ctx);
    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalledWith({ applicantId: "app-1", resumeUrl: "resume.pdf" });
    expect(mockParseInline).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ success: true, status: "PENDING" });
  });

  it("parses inline when mode=inline", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      resumeUrl: "resume.pdf",
      job: { organizationId: "org-1" },
    });
    mockParseInline.mockResolvedValue(undefined);

    const res = await POST(req("inline"), ctx);
    expect(res.status).toBe(200);
    expect(mockParseInline).toHaveBeenCalledWith("app-1", "resume.pdf");
    await expect(res.json()).resolves.toEqual({ success: true, status: "COMPLETED" });
  });

  it("marks parsingStatus FAILED and returns 500 when dispatch throws", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      resumeUrl: "resume.pdf",
      job: { organizationId: "org-1" },
    });
    mockDispatch.mockRejectedValue(new Error("queue down"));
    prismaMock.applicant.update.mockResolvedValue({});

    const res = await POST(req(), ctx);
    expect(res.status).toBe(500);
    expect(prismaMock.applicant.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "app-1" }, data: { parsingStatus: "FAILED" } }),
    );
    const body = await res.json();
    expect(body.error).toBe("queue down");
  });
});
