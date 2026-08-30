// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth, mockParseJobFromUrl } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
    },
    mockAuth: fn(),
    mockParseJobFromUrl: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/jobs/parseJobFromUrl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/jobs/parseJobFromUrl")>();
  return {
    ...actual,
    parseJobFromUrl: mockParseJobFromUrl,
  };
});

import { POST } from "./route";
import { JobUrlFetchError } from "@/lib/jobs/parseJobFromUrl";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/jobs/import-from-url", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { email: "admin@scoutlane.local" } });
  prismaMock.user.findUnique.mockResolvedValue({
    organizationId: "org-1",
    role: "ADMIN",
  });
  mockParseJobFromUrl.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/jobs/import-from-url", () => {
  it("401s when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ url: "https://example.test/job" }));
    expect(res.status).toBe(401);
  });

  it("403s when the user has no organization", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: null, role: "ADMIN" });
    const res = await POST(makeRequest({ url: "https://example.test/job" }));
    expect(res.status).toBe(403);
  });

  it("403s for a guest", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await POST(makeRequest({ url: "https://example.test/job" }));
    expect(res.status).toBe(403);
  });

  it("400s when the body has no url", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("400s with the fetch error's message when the URL fails validation/fetch", async () => {
    mockParseJobFromUrl.mockRejectedValue(new JobUrlFetchError("That URL redirects elsewhere."));
    const res = await POST(makeRequest({ url: "https://example.test/job" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("That URL redirects elsewhere.");
  });

  it("500s on an unexpected error without leaking details", async () => {
    mockParseJobFromUrl.mockRejectedValue(new Error("boom"));
    const res = await POST(makeRequest({ url: "https://example.test/job" }));
    expect(res.status).toBe(500);
  });

  it("returns the parsed job on success", async () => {
    mockParseJobFromUrl.mockResolvedValue({ title: "Senior Engineer", description: null });
    const res = await POST(makeRequest({ url: "https://example.test/job" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, job: { title: "Senior Engineer", description: null } });
  });
});
