// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedPrisma } from "@/test/prisma-mock";

const { prismaMock, mockAuth } = vi.hoisted(() => {
  // Re-implement createMockPrisma inline so the hoisted factory has no
  // dependency on a module that vi.mock would try to evaluate first.
  const fn = () => vi.fn();
  return {
    prismaMock: {
      pipelineStage: { findMany: fn() },
      applicant: {
        findMany: fn(),
        findUnique: fn(),
        create: fn(),
        update: fn(),
        delete: fn(),
      },
      job: {
        findMany: fn(),
        findUnique: fn(),
        findFirst: fn(),
        create: fn(),
        update: fn(),
      },
      user: {
        findUnique: fn(),
      },
    } satisfies MockedPrisma,
    mockAuth: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: mockAuth,
}));

import { GET } from "@/app/api/admin/jobs/[id]/pipeline/route";

interface PipelineColumn {
  id: string;
  name: string;
  color: string | null;
  order: number;
  applicants: Array<{
    id: string;
    name: string;
    email: string;
    score: number | null;
    status: string;
    createdAt: string;
    lastStageChangeAt: string;
    institution: string | null;
    program: string | null;
  }>;
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { email: "admin@scoutlane.local" } });
  prismaMock.user.findUnique.mockResolvedValue({
    organizationId: "org-1",
  });
  prismaMock.job.findFirst.mockResolvedValue({ id: "job-1" });
  prismaMock.pipelineStage.findMany.mockReset();
  prismaMock.applicant.findMany.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/jobs/[id]/pipeline", () => {
  it("groups applicants under stages whose UPPERCASED name matches ApplicationStatus", async () => {
    prismaMock.pipelineStage.findMany.mockResolvedValue([
      { id: "stage-new", name: "New", color: "#fff", order: 0 },
      { id: "stage-interview", name: "Interview", color: "#fff", order: 3 },
    ]);

    const createdAt = new Date("2026-04-01T00:00:00.000Z");
    prismaMock.applicant.findMany.mockResolvedValue([
      {
        id: "a1",
        name: "Ada",
        email: "ada@example.com",
        score: 9,
        status: "NEW",
        createdAt,
        pipelineStageId: "stage-new",
        lastStageChangeAt: createdAt,
        data: null,
      },
      {
        id: "a2",
        name: "Linus",
        email: "linus@example.com",
        score: 7,
        status: "INTERVIEW",
        createdAt,
        pipelineStageId: "stage-interview",
        lastStageChangeAt: createdAt,
        data: null,
      },
      {
        id: "a3",
        name: "Grace",
        email: "grace@example.com",
        score: 8,
        status: "NEW",
        createdAt,
        pipelineStageId: "stage-new",
        lastStageChangeAt: createdAt,
        data: null,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/admin/jobs/job-1/pipeline"),
      { params: Promise.resolve({ id: "job-1" }) },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as PipelineColumn[];

    expect(body).toHaveLength(2);
    expect(body[0].id).toBe("stage-new");
    expect(body[0].applicants.map((a) => a.id)).toEqual(["a1", "a3"]);
    expect(body[1].id).toBe("stage-interview");
    expect(body[1].applicants.map((a) => a.id)).toEqual(["a2"]);
  });

  it("serializes createdAt as ISO string", async () => {
    prismaMock.pipelineStage.findMany.mockResolvedValue([
      { id: "stage-new", name: "New", color: null, order: 0 },
    ]);
    const createdAt = new Date("2026-04-01T12:34:56.000Z");
    prismaMock.applicant.findMany.mockResolvedValue([
      {
        id: "a1",
        name: "Ada",
        email: "ada@example.com",
        score: null,
        status: "NEW",
        createdAt,
        pipelineStageId: "stage-new",
        lastStageChangeAt: createdAt,
        data: null,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/admin/jobs/job-1/pipeline"),
      { params: Promise.resolve({ id: "job-1" }) },
    );
    const body = (await response.json()) as PipelineColumn[];

    expect(body[0].applicants[0].createdAt).toBe("2026-04-01T12:34:56.000Z");
  });

  it("queries prisma scoped to the requested jobId", async () => {
    prismaMock.pipelineStage.findMany.mockResolvedValue([]);
    prismaMock.applicant.findMany.mockResolvedValue([]);

    await GET(new Request("http://localhost/api/admin/jobs/job-42/pipeline"), {
      params: Promise.resolve({ id: "job-42" }),
    });

    expect(prismaMock.pipelineStage.findMany).toHaveBeenCalledWith({
      where: { jobId: "job-42" },
      orderBy: { order: "asc" },
    });
    expect(prismaMock.applicant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: "job-42" },
        orderBy: { lastStageChangeAt: "desc" },
      }),
    );
  });

  it("groups applicants by pipelineStageId (not by status name)", async () => {
    prismaMock.pipelineStage.findMany.mockResolvedValue([
      { id: "stage-screening", name: "Screening", color: null, order: 1 },
      { id: "stage-offer", name: "Offer", color: null, order: 4 },
      { id: "stage-hired", name: "Hired", color: null, order: 5 },
    ]);
    const d = new Date();
    prismaMock.applicant.findMany.mockResolvedValue([
      {
        id: "a1",
        name: "Ada",
        email: "ada@example.com",
        score: 9,
        status: "REVIEWING",
        createdAt: d,
        pipelineStageId: "stage-screening",
        lastStageChangeAt: d,
        data: null,
      },
      {
        id: "a2",
        name: "Linus",
        email: "linus@example.com",
        score: 7,
        status: "OFFERED",
        createdAt: d,
        pipelineStageId: "stage-offer",
        lastStageChangeAt: d,
        data: null,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/admin/jobs/job-1/pipeline"),
      { params: Promise.resolve({ id: "job-1" }) },
    );
    const body = (await response.json()) as PipelineColumn[];

    expect(body.map((c) => c.applicants.length)).toEqual([1, 1, 0]);
  });
});
