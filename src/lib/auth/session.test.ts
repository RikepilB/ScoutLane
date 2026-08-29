import { beforeEach, describe, expect, it, vi } from "vitest";

const { clerkAuth, currentUser, syncUserFromClerk } = vi.hoisted(() => ({
  clerkAuth: vi.fn(),
  currentUser: vi.fn(),
  syncUserFromClerk: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: clerkAuth,
  currentUser,
}));

vi.mock("./sync-user", () => ({
  syncUserFromClerk,
}));

import { getAppSession } from "./session";

describe("getAppSession", () => {
  beforeEach(() => {
    clerkAuth.mockReset();
    currentUser.mockReset();
    syncUserFromClerk.mockReset();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("returns an anonymous session without calling Clerk when Clerk is not configured", async () => {
    await expect(getAppSession()).resolves.toBeNull();
    expect(clerkAuth).not.toHaveBeenCalled();
  });
});
