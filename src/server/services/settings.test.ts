import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockGetCurrentUser, mockRevalidatePath } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { update: fn(), updateMany: fn() },
      organization: { findUnique: fn(), update: fn() },
    },
    mockGetCurrentUser: fn(),
    mockRevalidatePath: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("./current-user", () => ({ getCurrentUserWithOrganization: mockGetCurrentUser }));

import { updateMyProfile, updateOrganizationSettings, updateTeamMemberRole } from "./settings";

function fd(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockRevalidatePath.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.user.updateMany.mockReset();
  prismaMock.organization.findUnique.mockReset();
  prismaMock.organization.update.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateMyProfile", () => {
  it("fails when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const result = await updateMyProfile(fd({ name: "Ada", phone: "" }));
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("blocks GUEST role", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "GUEST" });
    const result = await updateMyProfile(fd({ name: "Ada", phone: "" }));
    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a name over 120 chars", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN" });
    const result = await updateMyProfile(fd({ name: "a".repeat(121), phone: "" }));
    expect(result.success).toBe(false);
  });

  it("updates the caller's own profile and revalidates", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "RECRUITER" });
    const result = await updateMyProfile(fd({ name: "Ada Lovelace", phone: "555-1234" }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Ada Lovelace", phone: "555-1234" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/settings");
  });
});

describe("updateOrganizationSettings", () => {
  it("blocks non-admin roles", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "RECRUITER", organizationId: "org-1" });
    const result = await updateOrganizationSettings(fd({ name: "Acme", slug: "acme" }));
    expect(result).toEqual({ success: false, error: "Only admins can update settings" });
    expect(prismaMock.organization.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    const result = await updateOrganizationSettings(fd({ name: "Acme", slug: "Not Valid!" }));
    expect(result.success).toBe(false);
  });

  it("rejects a slug already used by another organization", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    prismaMock.organization.findUnique.mockResolvedValue({ id: "org-2" });
    const result = await updateOrganizationSettings(fd({ name: "Acme", slug: "taken-slug" }));
    expect(result).toEqual({ success: false, error: "That organization slug is already in use" });
  });

  it("allows keeping the org's own existing slug", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    prismaMock.organization.findUnique.mockResolvedValue({ id: "org-1" });
    const result = await updateOrganizationSettings(fd({ name: "Acme", slug: "acme" }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.organization.update).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { name: "Acme", slug: "acme" },
    });
  });
});

describe("updateTeamMemberRole", () => {
  it("blocks non-admin roles from changing anyone's role", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "RECRUITER", organizationId: "org-1" });
    const result = await updateTeamMemberRole(fd({ userId: "u2", role: "ADMIN" }));
    expect(result).toEqual({ success: false, error: "Only admins can manage team roles" });
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an invalid role value", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    const result = await updateTeamMemberRole(fd({ userId: "u2", role: "SUPERADMIN" }));
    expect(result.success).toBe(false);
  });

  it("scopes the role update to the admin's own organization (no cross-org escalation)", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
    const result = await updateTeamMemberRole(fd({ userId: "u2", role: "ADMIN" }));
    expect(result).toEqual({ success: true });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u2", organizationId: "org-1" },
      data: { role: "ADMIN" },
    });
  });
});
