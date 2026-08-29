import { createHmac, timingSafeEqual } from "node:crypto";

function integrationKey(): string {
  const key = process.env.INTEGRATION_KEY_SECRET;
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("INTEGRATION_KEY_SECRET must be configured in production.");
  }
  return key ?? "";
}

export function signPayload(payload: string, webhookSecret?: string): string {
  return createHmac("sha256", webhookSecret || integrationKey()).update(payload).digest("hex");
}

export function verifyPayload(payload: string, signature: string): boolean {
  const expected = Buffer.from(signPayload(payload), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
