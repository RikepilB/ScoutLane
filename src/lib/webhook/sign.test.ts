// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { signPayload, verifyPayload } from "./sign";

const originalKey = process.env.INTEGRATION_KEY_SECRET;
afterEach(() => {
  if (originalKey === undefined) delete process.env.INTEGRATION_KEY_SECRET;
  else process.env.INTEGRATION_KEY_SECRET = originalKey;
  vi.unstubAllEnvs();
});

describe("webhook payload signatures", () => {
  it("verifies a matching signature and rejects a modified one", () => {
    process.env.INTEGRATION_KEY_SECRET = "test-key";
    const signature = signPayload('{"event":"test"}');

    expect(verifyPayload('{"event":"test"}', signature)).toBe(true);
    expect(verifyPayload('{"event":"other"}', signature)).toBe(false);
  });

  it("fails closed when the production signing key is absent", () => {
    delete process.env.INTEGRATION_KEY_SECRET;
    vi.stubEnv("NODE_ENV", "production");

    expect(() => signPayload("payload")).toThrow("INTEGRATION_KEY_SECRET");
  });
});
