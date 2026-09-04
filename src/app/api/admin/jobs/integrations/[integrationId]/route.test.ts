// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth, mockValidateEgressUrl, mockDecryptSecret, mockRedact } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      jobIntegration: { findUnique: fn(), delete: fn(), update: fn() },
      integrationLog: { create: fn(), findFirst: fn() },
    },
    mockAuth: fn(),
    mockValidateEgressUrl: fn(),
    mockDecryptSecret: fn(),
    mockRedact: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/webhook/validate-egress-url", () => ({ validateEgressUrl: mockValidateEgressUrl }));
vi.mock("@/lib/security/integration-secrets", () => ({ decryptSecret: mockDecryptSecret }));
vi.mock("@/lib/security/integration-response-redaction", () => ({
  redactIntegrationResponse: mockRedact,
}));

import { NextRequest } from "next/server";
import { DELETE, POST } from "./route";

const ctx = { params: Promise.resolve({ integrationId: "int-1" }) };

function req(action?: string) {
  const url = action ? `http://x?action=${action}` : "http://x";
  return new NextRequest(url, { method: "POST" });
}

const baseIntegration = {
  id: "int-1",
  endpointUrl: "https://x.com/hook",
  apiKey: "encrypted",
  includeQuestions: false,
  job: {
    organizationId: "org-1",
    title: "Engineer",
    assessmentTitle: null,
    assessmentQuestions: null,
  },
};

beforeEach(() => {
  mockAuth.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.jobIntegration.findUnique.mockReset();
  prismaMock.jobIntegration.delete.mockReset();
  prismaMock.jobIntegration.update.mockReset();
  prismaMock.integrationLog.create.mockReset();
  prismaMock.integrationLog.findFirst.mockReset();
  mockValidateEgressUrl.mockReset();
  mockDecryptSecret.mockReset();
  mockRedact.mockReset();

  mockAuth.mockResolvedValue({ user: { email: "u@x.com" } });
  prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "ADMIN" });
  mockDecryptSecret.mockReturnValue("plain-key");
  mockRedact.mockImplementation((v: string | null) => v);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/admin/jobs/integrations/[integrationId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(req("test"), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 403 for a GUEST role", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1", role: "GUEST" });
    const res = await POST(req("test"), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 404 when the integration is in a different org", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue({
      ...baseIntegration,
      job: { ...baseIntegration.job, organizationId: "org-2" },
    });
    const res = await POST(req("test"), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 400 when the stored endpoint fails egress validation", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockRejectedValue(new Error("Blocked"));
    const res = await POST(req("test"), ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 for an unsupported action", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockResolvedValue(undefined);
    const res = await POST(req(), ctx);
    expect(res.status).toBe(400);
  });

  it("action=test posts a sample payload with the decrypted bearer token and logs the result", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockResolvedValue(undefined);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      text: async () => "ok",
    });

    const res = await POST(req("test"), ctx);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      "https://x.com/hook",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer plain-key" }),
      }),
    );
    expect(prismaMock.integrationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event: "integration_test", status: 200 }) }),
    );
  });

  it("action=test logs a network failure as status 0 and returns 500", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockResolvedValue(undefined);
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(req("test"), ctx);
    expect(res.status).toBe(500);
    expect(prismaMock.integrationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 0 }) }),
    );
  });

  it("action=retry returns 400 when there's no prior request to retry", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockResolvedValue(undefined);
    prismaMock.integrationLog.findFirst.mockResolvedValue(null);

    const res = await POST(req("retry"), ctx);
    expect(res.status).toBe(400);
  });

  it("action=retry replays the last failed request body and marks success on 2xx", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockResolvedValue(undefined);
    prismaMock.integrationLog.findFirst.mockResolvedValue({
      requestBody: JSON.stringify({ event: "stage_transition" }),
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 200, ok: true, text: async () => "ok" });

    const res = await POST(req("retry"), ctx);
    expect(res.status).toBe(200);
    expect(prismaMock.jobIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failureCount: 0 }) }),
    );
  });

  it("action=retry increments failureCount when the replay still fails", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue(baseIntegration);
    mockValidateEgressUrl.mockResolvedValue(undefined);
    prismaMock.integrationLog.findFirst.mockResolvedValue({
      requestBody: JSON.stringify({ event: "stage_transition" }),
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 500, ok: false, text: async () => "err" });

    const res = await POST(req("retry"), ctx);
    expect(res.status).toBe(200);
    expect(prismaMock.jobIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ failureCount: { increment: 1 } }) }),
    );
  });
});

describe("DELETE /api/admin/jobs/integrations/[integrationId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(req(), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 for a cross-org integration", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue({
      job: { organizationId: "org-2" },
    });
    const res = await DELETE(req(), ctx);
    expect(res.status).toBe(404);
    expect(prismaMock.jobIntegration.delete).not.toHaveBeenCalled();
  });

  it("deletes the integration on success", async () => {
    prismaMock.jobIntegration.findUnique.mockResolvedValue({
      job: { organizationId: "org-1" },
    });
    const res = await DELETE(req(), ctx);
    expect(res.status).toBe(200);
    expect(prismaMock.jobIntegration.delete).toHaveBeenCalledWith({ where: { id: "int-1" } });
  });
});
