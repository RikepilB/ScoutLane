import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUserList, mockCreateSignInToken, mockClerkClient } = vi.hoisted(() => ({
  mockGetUserList: vi.fn(),
  mockCreateSignInToken: vi.fn(),
  mockClerkClient: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: mockClerkClient,
}));

import { signInAsDemo } from "./demo-sign-in";

beforeEach(() => {
  mockClerkClient.mockReset();
  mockGetUserList.mockReset();
  mockCreateSignInToken.mockReset();
  mockClerkClient.mockResolvedValue({
    users: {
      getUserList: mockGetUserList,
    },
    signInTokens: {
      createSignInToken: mockCreateSignInToken,
    },
  });
});

describe("signInAsDemo", () => {
  it("returns error when demo user is not found in Clerk", async () => {
    mockGetUserList.mockResolvedValue({ data: [] });
    const result = await signInAsDemo("admin");
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("admin@"),
    });
  });

  it("returns the sign-in token and redirect target for the client to redeem on-origin", async () => {
    mockGetUserList.mockResolvedValue({
      data: [{ id: "user-123" }],
    });
    mockCreateSignInToken.mockResolvedValue({
      token: "jwt-ticket-abc",
    });
    const result = await signInAsDemo("admin", "/admin");
    expect(mockCreateSignInToken).toHaveBeenCalledWith({
      userId: "user-123",
      expiresInSeconds: 120,
    });
    expect(result).toEqual({
      ok: true,
      ticket: "jwt-ticket-abc",
      redirectTo: "/admin",
    });
  });

  it("returns a failure payload when token minting throws", async () => {
    mockGetUserList.mockResolvedValue({
      data: [{ id: "user-123" }],
    });
    mockCreateSignInToken.mockRejectedValue(new Error("boom"));
    const result = await signInAsDemo("recruiter");
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("boom"),
    });
  });
});
