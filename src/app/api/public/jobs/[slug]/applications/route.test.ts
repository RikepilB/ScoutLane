// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { prismaMock } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      job: { findUnique: fn() },
      applicant: { findFirst: fn(), create: fn() },
    },
  };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/jobs/status", () => ({
  canAcceptApplications: () => true,
}));

import { POST } from "@/app/api/public/jobs/[slug]/applications/route";
import { DUPLICATE_APPLICATION_MESSAGE } from "@/server/services/applications";

interface DuplicateBody {
  success: boolean;
  field?: string;
  error?: string;
}

beforeEach(() => {
  prismaMock.job.findUnique.mockReset();
  prismaMock.applicant.findFirst.mockReset();
  prismaMock.applicant.create.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

function postBody(body: Record<string, unknown>) {
  const request = new Request(
    "http://localhost/api/public/jobs/example/applications",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  ) as unknown as NextRequest;

  return POST(request, { params: Promise.resolve({ slug: "example" }) });
}

describe("POST /api/public/jobs/[slug]/applications", () => {
  it("returns 409 with field=email and the canonical duplicate message when an applicant exists", async () => {
    prismaMock.job.findUnique.mockResolvedValue({
      id: "job-1",
      slug: "example",
      published: true,
      archived: false,
    });
    prismaMock.applicant.findFirst.mockResolvedValue({ id: "existing" });

    const response = await postBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+1 555 123 4567",
    });

    expect(response.status).toBe(409);
    const body = (await response.json()) as DuplicateBody;
    expect(body.success).toBe(false);
    expect(body.field).toBe("email");
    expect(body.error).toBe(DUPLICATE_APPLICATION_MESSAGE);
  });

  it("does not flag duplicates when no applicant exists for that job + email", async () => {
    prismaMock.job.findUnique.mockResolvedValue({
      id: "job-1",
      slug: "example",
      published: true,
      archived: false,
    });
    prismaMock.applicant.findFirst.mockResolvedValue(null);
    prismaMock.applicant.create.mockResolvedValue({ id: "a-new", status: "NEW" });

    const response = await postBody({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+1 555 123 4567",
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });
});
