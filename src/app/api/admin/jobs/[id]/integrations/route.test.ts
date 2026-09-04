// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth, mockValidateEgressUrl, mockEncryptSecret } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      job: { findFirst: fn() },
      pipelineStage: { findFirst: fn() },
      jobIntegration: { create: fn() },
    },
    mockAuth: fn(),
    mockValidateEgressUrl: fn(),
    mockEncryptSecret: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/webhook/validate-egress-url", () => ({ validateEgressUrl: mockValidateEgressUrl }));
vi.mock("@/lib/security/integration-secrets", () => ({ encryptSecret: mockEncryptSecret }));

import { NextRequest } from "next/server";
import { POST } from "./route";

const ctx = { params: Promise.resolve({ id: "job-1" }) };

function req(body: unknown) {
  return new NextRequest("http://x", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  mockAuth.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.job.findFirst.mockReset();
  prismaMock.pipelineStage.findFirst.mockReset();
  prismaMock.jobIntegration.create.mockReset();
  mockValidateEgressUrl.mockReset();
  mockEncryptSecret.mockReset();
  mockEncryptSecret.mockImplementation((v: string) => `encrypted:${v}`);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/jobs/[id]/integrations", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(req({ stageId: "s1", endpointUrl: "https://x.com" }), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 400 when stageId or endpointUrl are missing", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    const res = await POST(req({ stageId: "s1" }), ctx);
    expect(res.status).toBe(400);
  });

  it("returns 403 for a GUEST role", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await POST(req({ stageId: "s1", endpointUrl: "https://x.com" }), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 400 when the endpoint URL fails SSRF validation", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mockValidateEgressUrl.mockRejectedValue(new Error("Blocked private IP"));

    const res = await POST(req({ stageId: "s1", endpointUrl: "http://169.254.169.254" }), ctx);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Blocked private IP" });
    expect(prismaMock.job.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when the job isn't found in the user's org", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mockValidateEgressUrl.mockResolvedValue("https://x.com");
    prismaMock.job.findFirst.mockResolvedValue(null);

    const res = await POST(req({ stageId: "s1", endpointUrl: "https://x.com" }), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 when the stage doesn't belong to the job", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mockValidateEgressUrl.mockResolvedValue("https://x.com");
    prismaMock.job.findFirst.mockResolvedValue({ id: "job-1" });
    prismaMock.pipelineStage.findFirst.mockResolvedValue(null);

    const res = await POST(req({ stageId: "s1", endpointUrl: "https://x.com" }), ctx);
    expect(res.status).toBe(404);
  });

  it("encrypts apiKey before persisting and strips it from the response", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mockValidateEgressUrl.mockResolvedValue("https://x.com");
    prismaMock.job.findFirst.mockResolvedValue({ id: "job-1" });
    prismaMock.pipelineStage.findFirst.mockResolvedValue({ id: "s1" });
    prismaMock.jobIntegration.create.mockResolvedValue({
      id: "int-1",
      jobId: "job-1",
      stageId: "s1",
      endpointUrl: "https://x.com",
      apiKey: "encrypted:secret-token",
      includeQuestions: false,
      active: true,
    });

    const res = await POST(req({ stageId: "s1", endpointUrl: "https://x.com", apiKey: "secret-token" }), ctx);
    expect(res.status).toBe(201);
    expect(mockEncryptSecret).toHaveBeenCalledWith("secret-token");
    expect(prismaMock.jobIntegration.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ apiKey: "encrypted:secret-token" }) }),
    );
    const body = await res.json();
    expect(body.integration.apiKey).toBeUndefined();
  });

  it("returns 503 when the encryption key isn't configured", async () => {
    mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
    mockValidateEgressUrl.mockResolvedValue("https://x.com");
    prismaMock.job.findFirst.mockResolvedValue({ id: "job-1" });
    prismaMock.pipelineStage.findFirst.mockResolvedValue({ id: "s1" });
    prismaMock.jobIntegration.create.mockRejectedValue(
      new Error("INTEGRATION_SECRETS_ENCRYPTION_KEY is not set"),
    );

    const res = await POST(req({ stageId: "s1", endpointUrl: "https://x.com", apiKey: "k" }), ctx);
    expect(res.status).toBe(503);
  });
});
