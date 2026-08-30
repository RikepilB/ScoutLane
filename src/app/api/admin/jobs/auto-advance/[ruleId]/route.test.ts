// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: { findUnique: vi.fn() },
    autoAdvanceRule: { findUnique: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock("@/lib/auth/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: mocks.prisma }));

import { DELETE } from "./route";

const ctx = { params: Promise.resolve({ ruleId: "rule-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/admin/jobs/auto-advance/[ruleId]", () => {
  it("401s when unauthenticated", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await DELETE(new Request("http://x") as never, ctx);
    expect(res.status).toBe(401);
  });

  it("403s when a guest tries to delete a rule", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "guest@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await DELETE(new Request("http://x") as never, ctx);
    expect(res.status).toBe(403);
    expect(mocks.prisma.autoAdvanceRule.delete).not.toHaveBeenCalled();
  });

  it("404s when the rule belongs to another organization", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mocks.prisma.autoAdvanceRule.findUnique.mockResolvedValue({ id: "rule-1", job: { organizationId: "org-2" } });
    const res = await DELETE(new Request("http://x") as never, ctx);
    expect(res.status).toBe(404);
    expect(mocks.prisma.autoAdvanceRule.delete).not.toHaveBeenCalled();
  });

  it("deletes the rule and returns success", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "a@x.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mocks.prisma.autoAdvanceRule.findUnique.mockResolvedValue({ id: "rule-1", job: { organizationId: "org-1" } });

    const res = await DELETE(new Request("http://x") as never, ctx);

    expect(mocks.prisma.autoAdvanceRule.delete).toHaveBeenCalledWith({ where: { id: "rule-1" } });
    expect(res.status).toBe(200);
  });
});
