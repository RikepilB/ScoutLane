import { describe, it, expect, vi, beforeEach } from "vitest";

const { userUpsert, userFindUnique, orgFindFirst, orgCreate } = vi.hoisted(() => ({
  userUpsert: vi.fn(),
  userFindUnique: vi.fn(),
  orgFindFirst: vi.fn(),
  orgCreate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { upsert: userUpsert, findUnique: userFindUnique },
    organization: { findFirst: orgFindFirst, create: orgCreate },
  },
}));

import { syncUserFromClerk } from "./sync-user";
import { GUEST_EMAIL, DEMO_RECRUITER_EMAIL } from "./roles";

beforeEach(() => {
  userUpsert.mockReset();
  userFindUnique.mockReset();
  orgFindFirst.mockReset();
  orgCreate.mockReset();
  orgFindFirst.mockResolvedValue({ id: "org-1" });
  userFindUnique.mockResolvedValue(null);
  userUpsert.mockImplementation(({ create }) =>
    Promise.resolve({ id: "u1", ...create, organizationId: create.organizationId ?? null }),
  );
  delete process.env.INITIAL_ADMIN_EMAIL;
});

describe("syncUserFromClerk", () => {
  it("creates a guest user with GUEST role", async () => {
    await syncUserFromClerk({ email: GUEST_EMAIL, name: "Guest" });
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.create).toEqual(
      expect.objectContaining({ email: GUEST_EMAIL, role: "GUEST", organizationId: "org-1" }),
    );
    expect(arg.update).toEqual(expect.objectContaining({ role: "GUEST" }));
  });

  it("promotes INITIAL_ADMIN_EMAIL to ADMIN", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "boss@scoutlane.com";
    await syncUserFromClerk({ email: "boss@scoutlane.com", name: "Boss" });
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.create).toEqual(expect.objectContaining({ role: "ADMIN" }));
    expect(arg.update).toEqual(expect.objectContaining({ role: "ADMIN" }));
  });

  it("pins recruiter demo email to RECRUITER on update", async () => {
    await syncUserFromClerk({ email: DEMO_RECRUITER_EMAIL, name: "Maya Recruiter" });
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.create).toEqual(expect.objectContaining({ role: "RECRUITER" }));
    expect(arg.update).toEqual(expect.objectContaining({ role: "RECRUITER" }));
  });

  it("creates invited users as RECRUITER with an organization attached", async () => {
    await syncUserFromClerk({ email: "Jane@Example.com", name: "Jane" });
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.where).toEqual({ email: "jane@example.com" });
    expect(arg.create).toEqual(
      expect.objectContaining({ role: "RECRUITER", organizationId: "org-1" }),
    );
    expect(arg.update).not.toHaveProperty("role");
  });

  it("never reassigns an existing organization membership", async () => {
    userFindUnique.mockResolvedValue({ organizationId: "org-existing", role: "RECRUITER" });
    await syncUserFromClerk({ email: "jane@example.com" });
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.update).not.toHaveProperty("organizationId");
    expect(orgFindFirst).not.toHaveBeenCalled();
  });

  it("attaches an organization to a user that has none", async () => {
    userFindUnique.mockResolvedValue({ organizationId: null, role: "RECRUITER" });
    await syncUserFromClerk({ email: "jane@example.com" });
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.update).toEqual(expect.objectContaining({ organizationId: "org-1" }));
  });
});
