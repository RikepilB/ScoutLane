import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn(), update: fn() },
      organization: { create: fn() },
    },
    mockAuth: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));

import { getCurrentUserWithOrganization } from "./current-user";

beforeEach(() => {
  mockAuth.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.organization.create.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUserWithOrganization", () => {
  it("returns null when there's no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getCurrentUserWithOrganization();
    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when the session user doesn't exist in the DB", async () => {
    mockAuth.mockResolvedValue({ user: { email: "ghost@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await getCurrentUserWithOrganization();
    expect(result).toBeNull();
  });

  it("returns the user as-is when they already have an organization", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    const user = { id: "u1", organizationId: "org-1", organization: { id: "org-1" } };
    prismaMock.user.findUnique.mockResolvedValue(user);
    const result = await getCurrentUserWithOrganization();
    expect(result).toBe(user);
    expect(prismaMock.organization.create).not.toHaveBeenCalled();
  });

  it("auto-creates a fallback organization when the user has none", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1abc123", organizationId: null });
    prismaMock.organization.create.mockResolvedValue({ id: "org-new" });
    prismaMock.user.update.mockResolvedValue({ id: "u1abc123", organizationId: "org-new" });

    const result = await getCurrentUserWithOrganization();

    expect(prismaMock.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "scoutlane-u1abc123" }) }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1abc123" },
        data: { organizationId: "org-new" },
      }),
    );
    expect(result).toEqual({ id: "u1abc123", organizationId: "org-new" });
  });
});
