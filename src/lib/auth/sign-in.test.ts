import { describe, it, expect, vi, beforeEach } from "vitest";

const { userUpsert, orgFindFirst, orgCreate } = vi.hoisted(() => ({
  userUpsert: vi.fn(),
  orgFindFirst: vi.fn(),
  orgCreate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { upsert: userUpsert },
    organization: { findFirst: orgFindFirst, create: orgCreate },
  },
}));

import { handleSignIn } from "./sign-in";

beforeEach(() => {
  userUpsert.mockReset();
  orgFindFirst.mockReset();
  orgCreate.mockReset();
  orgFindFirst.mockResolvedValue({ id: "org-1" });
  userUpsert.mockResolvedValue({ id: "u1", email: "dev@scoutlane.local", role: "ADMIN" });
});

describe("handleSignIn — dev provider", () => {
  it("upserts an ADMIN User row for the dev email", async () => {
    const ok = await handleSignIn({
      user: { email: "dev@scoutlane.local", name: "Dev" },
      account: { provider: "dev" },
    });

    expect(ok).toBe(true);
    expect(userUpsert).toHaveBeenCalledTimes(1);
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.where).toEqual({ email: "dev@scoutlane.local" });
    expect(arg.create).toEqual(
      expect.objectContaining({ email: "dev@scoutlane.local", role: "ADMIN", organizationId: "org-1" }),
    );
    expect(arg.update).toEqual(expect.objectContaining({ role: "ADMIN" }));
  });

  it("reuses the existing organization rather than creating one", async () => {
    await handleSignIn({
      user: { email: "dev@scoutlane.local" },
      account: { provider: "dev" },
    });
    expect(orgCreate).not.toHaveBeenCalled();
  });

  it("does not block sign-in when the upsert throws", async () => {
    userUpsert.mockRejectedValue(new Error("db down"));
    const ok = await handleSignIn({
      user: { email: "dev@scoutlane.local" },
      account: { provider: "dev" },
    });
    expect(ok).toBe(true);
  });

  it("returns true without an upsert when the dev email is missing", async () => {
    const ok = await handleSignIn({ user: { email: null }, account: { provider: "dev" } });
    expect(ok).toBe(true);
    expect(userUpsert).not.toHaveBeenCalled();
  });
});

describe("handleSignIn — Google provider", () => {
  it("rejects sign-in with no email", async () => {
    const ok = await handleSignIn({ user: { email: null }, account: { provider: "google" } });
    expect(ok).toBe(false);
    expect(userUpsert).not.toHaveBeenCalled();
  });

  it("promotes the INITIAL_ADMIN_EMAIL to ADMIN", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "boss@scoutlane.com";
    try {
      await handleSignIn({
        user: { email: "boss@scoutlane.com", name: "Boss" },
        account: { provider: "google" },
      });
      expect(userUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "boss@scoutlane.com" } }),
      );
    } finally {
      delete process.env.INITIAL_ADMIN_EMAIL;
    }
  });
});
