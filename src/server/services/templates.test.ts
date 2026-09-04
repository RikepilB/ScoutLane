import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockGetCurrentUser, mockRevalidatePath, mockRedirect } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      jobTemplate: { create: fn(), updateMany: fn(), deleteMany: fn() },
    },
    mockGetCurrentUser: fn(),
    mockRevalidatePath: fn(),
    mockRedirect: vi.fn((url: string) => {
      throw new Error(`Redirect to ${url}`);
    }),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("./current-user", () => ({ getCurrentUserWithOrganization: mockGetCurrentUser }));

import { createTemplate, deleteTemplate, updateTemplate } from "./templates";

function fd(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

const validTemplateFields = {
  name: "Engineering template",
  title: "Software Engineer",
  stageNames: "Applied\nInterview\nOffer",
  questions: "Tell us about yourself.",
};

beforeEach(() => {
  mockGetCurrentUser.mockReset();
  mockRevalidatePath.mockReset();
  mockRedirect.mockReset();
  prismaMock.jobTemplate.create.mockReset();
  prismaMock.jobTemplate.updateMany.mockReset();
  prismaMock.jobTemplate.deleteMany.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createTemplate", () => {
  it("redirects to sign-in when unauthenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(createTemplate()).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/signin?callbackUrl=/admin/templates");
    expect(prismaMock.jobTemplate.create).not.toHaveBeenCalled();
  });

  it("throws for a GUEST role", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "GUEST", organizationId: "org-1" });
    await expect(createTemplate()).rejects.toThrow();
    expect(prismaMock.jobTemplate.create).not.toHaveBeenCalled();
  });

  it("creates a default template scoped to the caller's org", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    prismaMock.jobTemplate.create.mockResolvedValue({ id: "tmpl-1" });

    const result = await createTemplate();
    expect(result).toEqual({ id: "tmpl-1" });
    expect(prismaMock.jobTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", createdById: "u1" }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/templates");
  });
});

describe("updateTemplate", () => {
  it("redirects to sign-in when unauthenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(updateTemplate("tmpl-1", fd(validTemplateFields))).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith("/signin?callbackUrl=/admin/templates");
  });

  it("throws on invalid form data (missing stages)", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    await expect(
      updateTemplate("tmpl-1", fd({ name: "X", title: "Y", stageNames: "", questions: "" })),
    ).rejects.toThrow();
    expect(prismaMock.jobTemplate.updateMany).not.toHaveBeenCalled();
  });

  it("scopes the update to templates owned by the caller's org", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    prismaMock.jobTemplate.updateMany.mockResolvedValue({ count: 1 });

    await expect(updateTemplate("tmpl-1", fd(validTemplateFields))).rejects.toThrow();

    expect(prismaMock.jobTemplate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tmpl-1", organizationId: "org-1" },
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/templates");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/templates/tmpl-1");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/templates");
  });
});

describe("deleteTemplate", () => {
  it("redirects to sign-in when unauthenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(deleteTemplate("tmpl-1")).rejects.toThrow();
    expect(prismaMock.jobTemplate.deleteMany).not.toHaveBeenCalled();
  });

  it("scopes the delete to templates owned by the caller's org", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "u1", role: "ADMIN", organizationId: "org-1" });
    prismaMock.jobTemplate.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteTemplate("tmpl-1")).rejects.toThrow();

    expect(prismaMock.jobTemplate.deleteMany).toHaveBeenCalledWith({
      where: { id: "tmpl-1", organizationId: "org-1" },
    });
    expect(mockRedirect).toHaveBeenCalledWith("/admin/templates");
  });
});
