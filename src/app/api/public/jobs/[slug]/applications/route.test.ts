// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { prismaMock } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      job: { findUnique: fn() },
      applicant: { findFirst: fn(), create: fn(), findUnique: fn() },
    },
  };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/jobs/status", () => ({
  canAcceptApplications: () => true,
}));

import { GET, POST } from "@/app/api/public/jobs/[slug]/applications/route";
import { DUPLICATE_APPLICATION_MESSAGE } from "@/schemas/application";

interface DuplicateBody {
  success: boolean;
  field?: string;
  error?: string;
}

beforeEach(() => {
  prismaMock.job.findUnique.mockReset();
  prismaMock.applicant.findFirst.mockReset();
  prismaMock.applicant.create.mockReset();
  prismaMock.applicant.findUnique.mockReset();
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

function getRequest(url: string, ip: string) {
  return new Request(url, {
    headers: { "x-forwarded-for": ip },
  }) as unknown as NextRequest;
}

const ctx = { params: Promise.resolve({ slug: "example" }) };

describe("GET /api/public/jobs/[slug]/applications", () => {
  it("returns the applicant's status when found and owned by this job", async () => {
    prismaMock.job.findUnique.mockResolvedValue({ id: "job-1", slug: "example" });
    prismaMock.applicant.findUnique.mockResolvedValue({
      id: "app-1",
      jobId: "job-1",
      status: "NEW",
    });

    const response = await GET(
      getRequest("http://localhost/api/public/jobs/example/applications?applicationId=app-1", "203.0.113.1"),
      ctx,
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { success: boolean; data: { status: string } | null };
    expect(body.data?.status).toBe("NEW");
  });

  it("returns null data for an applicationId belonging to another job (no cross-job leak)", async () => {
    prismaMock.job.findUnique.mockResolvedValue({ id: "job-1", slug: "example" });
    prismaMock.applicant.findUnique.mockResolvedValue({
      id: "app-1",
      jobId: "job-other",
      status: "NEW",
    });

    const response = await GET(
      getRequest("http://localhost/api/public/jobs/example/applications?applicationId=app-1", "203.0.113.2"),
      ctx,
    );

    const body = (await response.json()) as { success: boolean; data: unknown };
    expect(body.data).toBeNull();
  });

  it("is rate limited per IP after repeated requests", async () => {
    prismaMock.job.findUnique.mockResolvedValue({ id: "job-1", slug: "example" });
    prismaMock.applicant.findUnique.mockResolvedValue(null);

    const ip = "203.0.113.3";
    let lastResponse;
    for (let i = 0; i < 11; i++) {
      lastResponse = await GET(
        getRequest("http://localhost/api/public/jobs/example/applications", ip),
        ctx,
      );
    }

    expect(lastResponse!.status).toBe(429);
  });
});
