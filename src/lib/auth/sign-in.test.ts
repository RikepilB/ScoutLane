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

import { handleSignIn } from "./sign-in";

beforeEach(() => {
  userUpsert.mockReset();
  userFindUnique.mockReset();
  orgFindFirst.mockReset();
  orgCreate.mockReset();
  orgFindFirst.mockResolvedValue({ id: "org-1" });
  userFindUnique.mockResolvedValue(null);
  userUpsert.mockResolvedValue({ id: "u1", email: "dev@scoutlane.local", role: "ADMIN" });
  delete process.env.AUTH_ALLOWED_EMAIL_DOMAIN;
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
      const arg = userUpsert.mock.calls[0][0];
      expect(arg.where).toEqual({ email: "boss@scoutlane.com" });
      expect(arg.create).toEqual(expect.objectContaining({ role: "ADMIN" }));
      expect(arg.update).toEqual(expect.objectContaining({ role: "ADMIN" }));
    } finally {
      delete process.env.INITIAL_ADMIN_EMAIL;
    }
  });

  it("upserts a regular Google user as RECRUITER with an organization attached", async () => {
    const ok = await handleSignIn({
      user: { email: "Jane@Example.com", name: "Jane" },
      account: { provider: "google" },
    });

    expect(ok).toBe(true);
    const arg = userUpsert.mock.calls[0][0];
    expect(arg.where).toEqual({ email: "jane@example.com" });
    expect(arg.create).toEqual(
      expect.objectContaining({ role: "RECRUITER", organizationId: "org-1" }),
    );
    expect(arg.update).not.toHaveProperty("role");
  });

  it("never reassigns an existing organization membership", async () => {
    userFindUnique.mockResolvedValue({ organizationId: "org-existing" });

    await handleSignIn({
      user: { email: "jane@example.com" },
      account: { provider: "google" },
    });

    const arg = userUpsert.mock.calls[0][0];
    expect(arg.update).not.toHaveProperty("organizationId");
    expect(orgFindFirst).not.toHaveBeenCalled();
  });

  it("attaches an organization to a user that has none", async () => {
    userFindUnique.mockResolvedValue({ organizationId: null });

    await handleSignIn({
      user: { email: "jane@example.com" },
      account: { provider: "google" },
    });

    const arg = userUpsert.mock.calls[0][0];
    expect(arg.update).toEqual(expect.objectContaining({ organizationId: "org-1" }));
  });

  it("does not block sign-in when the DB is unavailable", async () => {
    userFindUnique.mockRejectedValue(new Error("db down"));

    const ok = await handleSignIn({
      user: { email: "jane@example.com" },
      account: { provider: "google" },
    });

    expect(ok).toBe(true);
  });

  it("rejects emails outside AUTH_ALLOWED_EMAIL_DOMAIN when set", async () => {
    process.env.AUTH_ALLOWED_EMAIL_DOMAIN = "scoutlane.com";

    const rejected = await handleSignIn({
      user: { email: "stranger@gmail.com" },
      account: { provider: "google" },
    });
    const allowed = await handleSignIn({
      user: { email: "jane@scoutlane.com" },
      account: { provider: "google" },
    });

    expect(rejected).toBe(false);
    expect(allowed).toBe(true);
    expect(userUpsert).toHaveBeenCalledTimes(1);
  });

  it("blocks lookalike domains that merely end with the allowed domain", async () => {
    process.env.AUTH_ALLOWED_EMAIL_DOMAIN = "scoutlane.com";

    const rejected = await handleSignIn({
      user: { email: "attacker@fakescoutlane.com" },
      account: { provider: "google" },
    });
    const subdomainRejected = await handleSignIn({
      user: { email: "attacker@evil.scoutlane.com" },
      account: { provider: "google" },
    });
    const allowed = await handleSignIn({
      user: { email: "jane@scoutlane.com" },
      account: { provider: "google" },
    });

    expect(rejected).toBe(false);
    expect(subdomainRejected).toBe(false);
    expect(allowed).toBe(true);
    expect(userUpsert).toHaveBeenCalledTimes(1);
  });
});
