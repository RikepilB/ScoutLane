// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      job: { findFirst: fn() },
      applicant: { findMany: fn() },
    },
    mockAuth: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));

import { GET } from "./route";

const ctx = { params: Promise.resolve({ id: "job-1" }) };

beforeEach(() => {
  mockAuth.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.job.findFirst.mockReset();
  prismaMock.applicant.findMany.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/jobs/[id]/applicants/export", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://x"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the user has no organization", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: null, role: "ADMIN" });
    const res = await GET(new Request("http://x"), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 403 for a GUEST role", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await GET(new Request("http://x"), ctx);
    expect(res.status).toBe(403);
    expect(prismaMock.job.findFirst).not.toHaveBeenCalled();
  });

  it("returns 403 for a RECRUITER role (export is ADMIN-only)", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "RECRUITER" });
    const res = await GET(new Request("http://x"), ctx);
    expect(res.status).toBe(403);
    expect(prismaMock.job.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the job isn't found in the user's org", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    prismaMock.job.findFirst.mockResolvedValue(null);
    const res = await GET(new Request("http://x"), ctx);
    expect(res.status).toBe(404);
  });

  it("returns a CSV with an escaped formula-injection field", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    prismaMock.job.findFirst.mockResolvedValue({ title: "Engineer", slug: "engineer" });
    prismaMock.applicant.findMany.mockResolvedValue([
      {
        id: "a1",
        name: "=cmd|' /C calc'!A1",
        email: "a1@example.com",
        phone: "555-1234",
        status: "NEW",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        resumeUrl: "resume.pdf",
        parsingStatus: "DONE",
        pipelineStage: { name: "New" },
      },
    ]);

    const res = await GET(new Request("http://x"), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("applicants-engineer.csv");
    const body = await res.text();
    expect(body).toContain("'=cmd");
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jobId: "job-1" } }),
    );
  });
});
