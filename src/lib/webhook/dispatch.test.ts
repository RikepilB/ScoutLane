// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createLog: vi.fn(),
  validateEgressUrl: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    webhook: { findUnique: mocks.findUnique },
    webhookLog: { create: mocks.createLog },
  },
}));

vi.mock("./validate-egress-url", () => ({ validateEgressUrl: mocks.validateEgressUrl }));

import { dispatchWebhook } from "./dispatch";
import { encryptSecret } from "@/lib/security/integration-secrets";
import { signPayload } from "./sign";

const originalKey = process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY;
const testKey = Buffer.alloc(32, 9).toString("base64");

afterEach(() => {
  mocks.findUnique.mockReset();
  mocks.createLog.mockReset();
  mocks.validateEgressUrl.mockReset();
  vi.unstubAllGlobals();
  if (originalKey === undefined) delete process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY;
  else process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = originalKey;
});

describe("webhook dispatch", () => {
  it("decrypts an encrypted webhook secret only to sign the server-side request", async () => {
    process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = testKey;
    const webhookSecret = "webhook-token-9876";
    mocks.findUnique.mockResolvedValue({
      id: "webhook-1",
      url: "https://example.test/hooks",
      secret: encryptSecret(webhookSecret),
      active: true,
    });
    mocks.validateEgressUrl.mockResolvedValue(undefined);
    mocks.createLog.mockResolvedValue(undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(dispatchWebhook("webhook-1", "candidate.created", { id: "candidate-1" })).resolves.toEqual({
      success: true,
      statusCode: 202,
    });

    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = request.body as string;
    expect(url).toBe("https://example.test/hooks");
    expect(request.headers).toMatchObject({
      "X-Webhook-Signature": signPayload(payload, webhookSecret),
    });
  });
});
