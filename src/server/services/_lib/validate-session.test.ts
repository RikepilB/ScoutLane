// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: mocks.prisma }));

import { assertNotGuest, requireRole, requireSession } from "./validate-session";

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.prisma.user.findUnique.mockReset();
});

describe("assertNotGuest", () => {
  it("throws for GUEST role", () => {
    expect(() => assertNotGuest({ role: "GUEST" })).toThrow(
      "Guests have read-only access.",
    );
  });

  it("allows non-guest roles", () => {
    expect(() => assertNotGuest({ role: "ADMIN" })).not.toThrow();
  });
});

describe("requireRole", () => {
  it("throws when the user's role isn't in the allowed list", () => {
    expect(() => requireRole({ role: "RECRUITER" }, ["ADMIN"])).toThrow(
      "You do not have permission to perform this action.",
    );
  });

  it("allows a role that is in the allowed list", () => {
    expect(() => requireRole({ role: "ADMIN" }, ["ADMIN"])).not.toThrow();
  });

  it("allows any of multiple permitted roles", () => {
    expect(() => requireRole({ role: "HIRING_MANAGER" }, ["ADMIN", "HIRING_MANAGER"])).not.toThrow();
  });
});

describe("requireSession", () => {
  function mockSignedIn(role: string) {
    mocks.auth.mockResolvedValue({ user: { email: "user@example.com" } });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role,
      organizationId: "org-1",
    });
  }

  it("rejects guests by default (mutation path)", async () => {
    mockSignedIn("GUEST");
    await expect(requireSession()).rejects.toThrow("Guests have read-only access.");
  });

  it("allows guests when explicitly permitted (read path)", async () => {
    mockSignedIn("GUEST");
    await expect(requireSession({ allowGuest: true })).resolves.toEqual({
      id: "user-1",
      email: "user@example.com",
      role: "GUEST",
      organizationId: "org-1",
    });
  });

  it("allows non-guest roles regardless of allowGuest", async () => {
    mockSignedIn("ADMIN");
    await expect(requireSession()).resolves.toMatchObject({ role: "ADMIN" });
  });
});
