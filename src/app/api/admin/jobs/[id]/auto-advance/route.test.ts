// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    job: { findFirst: vi.fn() },
    autoAdvanceRule: { create: vi.fn() },
  },
}));

vi.mock("@/lib/auth/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: mocks.prisma }));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://x/auto-advance", { method: "POST", body: JSON.stringify(body) }) as never;
}

const ctx = { params: Promise.resolve({ id: "job-1" }) };
const VALID_BODY = { sourceStageId: "stage-a", targetStageId: "stage-b", thresholdScore: 0.7 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/jobs/[id]/auto-advance", () => {
  it("401s when unauthenticated", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY), ctx);
    expect(res.status).toBe(401);
  });

  it("400s when sourceStageId or targetStageId is missing", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    const res = await POST(req({ thresholdScore: 0.5 }), ctx);
    expect(res.status).toBe(400);
  });

  it("400s when source and target stage are the same", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    const res = await POST(req({ ...VALID_BODY, targetStageId: "stage-a" }), ctx);
    expect(res.status).toBe(400);
  });

  it("400s when thresholdScore is out of range", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    const res = await POST(req({ ...VALID_BODY, thresholdScore: 1.5 }), ctx);
    expect(res.status).toBe(400);
  });

  it("403s when a guest tries to create a rule", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "guest@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await POST(req(VALID_BODY), ctx);
    expect(res.status).toBe(403);
    expect(mocks.prisma.autoAdvanceRule.create).not.toHaveBeenCalled();
  });

  it("404s when the job doesn't belong to the user's organization", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mocks.prisma.job.findFirst.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY), ctx);
    expect(res.status).toBe(404);
  });

  it("400s when the target stage does not come after the source stage", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mocks.prisma.job.findFirst.mockResolvedValue({
      stages: [{ id: "stage-a", order: 2 }, { id: "stage-b", order: 1 }],
    });
    const res = await POST(req(VALID_BODY), ctx);
    expect(res.status).toBe(400);
    expect(mocks.prisma.autoAdvanceRule.create).not.toHaveBeenCalled();
  });

  it("creates the rule and returns 201 on success", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mocks.prisma.job.findFirst.mockResolvedValue({
      stages: [{ id: "stage-a", order: 1 }, { id: "stage-b", order: 2 }],
    });
    mocks.prisma.autoAdvanceRule.create.mockResolvedValue({ id: "rule-1", ...VALID_BODY });

    const res = await POST(req(VALID_BODY), ctx);

    expect(mocks.prisma.autoAdvanceRule.create).toHaveBeenCalledWith({
      data: { jobId: "job-1", sourceStageId: "stage-a", targetStageId: "stage-b", thresholdScore: 0.7, active: true },
    });
    expect(res.status).toBe(201);
  });

  it("409s when a rule already exists for that source stage", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mocks.prisma.job.findFirst.mockResolvedValue({
      stages: [{ id: "stage-a", order: 1 }, { id: "stage-b", order: 2 }],
    });
    mocks.prisma.autoAdvanceRule.create.mockRejectedValue({ code: "P2002" });

    const res = await POST(req(VALID_BODY), ctx);
    expect(res.status).toBe(409);
  });
});
