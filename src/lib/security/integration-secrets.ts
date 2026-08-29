import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ENCRYPTED_SECRET_PREFIX = "scoutlane:secret:v1";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function encryptionKey(variableName = "INTEGRATION_SECRETS_ENCRYPTION_KEY"): Buffer {
  const encoded = process.env[variableName]?.trim();
  if (!encoded) {
    throw new Error(`${variableName} must be configured to store integration secrets.`);
  }

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error(`${variableName} must be a base64-encoded 32-byte key.`);
  }

  return key;
}

function previousEncryptionKey(): Buffer | null {
  return process.env.INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY?.trim()
    ? encryptionKey("INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY")
    : null;
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(`${ENCRYPTED_SECRET_PREFIX}:`);
}

/** Encrypts a secret for storage. Empty optional secrets remain empty. */
export function encryptSecret(value: string): string {
  if (!value) return "";

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_SECRET_PREFIX,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    authTag.toString("base64url"),
  ].join(":");
}

/**
 * Decrypts versioned ciphertext and deliberately leaves legacy plaintext intact.
 * This supports an additive rollout while `db:encrypt-integration-secrets` rotates
 * existing rows in place.
 */
export function decryptSecret(value: string): string {
  if (!value || !isEncryptedSecret(value)) return value;

  const parts = value.split(":");
  if (parts.length !== 6 || parts.slice(0, 3).join(":") !== ENCRYPTED_SECRET_PREFIX) {
    throw new Error("Integration secret has an unsupported encrypted format.");
  }

  const [, , , encodedIv, encodedCiphertext, encodedAuthTag] = parts;
  const keys = [encryptionKey(), previousEncryptionKey()].filter((key): key is Buffer => key !== null);

  for (const key of keys) {
    try {
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encodedIv, "base64url"));
      decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64url"));
      return Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      // Continue to the previous key during an intentional key rotation.
    }
  }

  throw new Error("Unable to decrypt integration secret.");
}

/** Returns a safe UI representation of a server-only plaintext secret. */
export function maskSecret(value: string): string | null {
  if (!value) return null;
  return `••••${value.slice(-4)}`;
}
