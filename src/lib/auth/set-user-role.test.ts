import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserRole } from "./set-user-role";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

describe("setUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const result = await setUserRole("ADMIN");

    expect(result).toEqual({ ok: false, error: "Not authenticated" });
  });

  it("returns error when no email found", async () => {
    (auth as any).mockResolvedValue({ userId: "user-123" });
    (currentUser as any).mockResolvedValue({
      emailAddresses: [],
    });

    const result = await setUserRole("ADMIN");

    expect(result).toEqual({ ok: false, error: "No email found" });
  });

  it("updates user role successfully", async () => {
    (auth as any).mockResolvedValue({ userId: "user-123" });
    (currentUser as any).mockResolvedValue({
      emailAddresses: [{ emailAddress: "test@example.com" }],
    });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-123",
      role: "GUEST",
    });
    (prisma.user.update as any).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      role: "ADMIN",
    });

    const result = await setUserRole("ADMIN");

    expect(result).toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: { role: "ADMIN" },
    });
  });

  it("returns error when update fails", async () => {
    (auth as any).mockResolvedValue({ userId: "user-123" });
    (currentUser as any).mockResolvedValue({
      emailAddresses: [{ emailAddress: "test@example.com" }],
    });
    (prisma.user.update as any).mockRejectedValue(new Error("DB error"));

    const result = await setUserRole("RECRUITER");

    expect(result).toEqual({ ok: false, error: "Failed to set role" });
  });
});
