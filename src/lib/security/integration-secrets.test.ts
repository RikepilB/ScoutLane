import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from "./integration-secrets";

const originalKey = process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY;
const originalPreviousKey = process.env.INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY;
const testKey = Buffer.alloc(32, 7).toString("base64");
const rotatedKey = Buffer.alloc(32, 8).toString("base64");

afterEach(() => {
  if (originalKey === undefined) delete process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY;
  else process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = originalKey;
  if (originalPreviousKey === undefined) delete process.env.INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY;
  else process.env.INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY = originalPreviousKey;
});

describe("integration secret encryption", () => {
  it("round-trips AES-GCM ciphertext without persisting plaintext", () => {
    process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = testKey;
    const plaintext = "integration-token-1234";

    const encrypted = encryptSecret(plaintext);

    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("keeps legacy rows readable until they are rotated", () => {
    delete process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY;

    expect(decryptSecret("legacy-token-1234")).toBe("legacy-token-1234");
  });

  it("supports a previous key while re-encrypting secrets during rotation", () => {
    process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = testKey;
    const encryptedWithPreviousKey = encryptSecret("integration-token-1234");

    process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = rotatedKey;
    process.env.INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY = testKey;
    const reencrypted = encryptSecret(decryptSecret(encryptedWithPreviousKey));

    delete process.env.INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY;
    expect(decryptSecret(reencrypted)).toBe("integration-token-1234");
    expect(() => decryptSecret(encryptedWithPreviousKey)).toThrow("Unable to decrypt integration secret.");
  });

  it("rejects tampered ciphertext without exposing the original value", () => {
    process.env.INTEGRATION_SECRETS_ENCRYPTION_KEY = testKey;
    const encrypted = encryptSecret("integration-token-1234");

    // Tamper the IV (16 unpadded base64url chars) so GCM auth always fails.
    const parts = encrypted.split(":");
    parts[3] = parts[3][0] === "A" ? "B" : "A";

    expect(() => decryptSecret(parts.join(":"))).toThrow("Unable to decrypt integration secret.");
  });

  it("masks a secret for UI display", () => {
    expect(maskSecret("integration-token-1234")).toBe("••••1234");
    expect(maskSecret("")).toBeNull();
  });
});
