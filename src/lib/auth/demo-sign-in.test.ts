import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUserList, mockCreateSignInToken, mockClerkClient, mockRedirect } = vi.hoisted(
  () => ({
    mockGetUserList: vi.fn(),
    mockCreateSignInToken: vi.fn(),
    mockClerkClient: vi.fn(),
    mockRedirect: vi.fn((url: string) => {
      throw new Error(`Redirect to ${url}`);
    }),
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: mockClerkClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { signInAsDemo } from "./demo-sign-in";

beforeEach(() => {
  mockClerkClient.mockReset();
  mockGetUserList.mockReset();
  mockCreateSignInToken.mockReset();
  mockRedirect.mockReset();
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

  it("creates token and calls redirect on success", async () => {
    mockGetUserList.mockResolvedValue({
      data: [{ id: "user-123" }],
    });
    mockCreateSignInToken.mockResolvedValue({
      url: "https://clerk.example.com/token?jwt=xyz",
    });
    await signInAsDemo("admin");
    expect(mockCreateSignInToken).toHaveBeenCalledWith({
      userId: "user-123",
      expiresInSeconds: 120,
    });
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining("jwt=xyz"));
  });
});
