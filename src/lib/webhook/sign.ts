import { createHmac } from "node:crypto";

const INTEGRATION_KEY = process.env.INTEGRATION_KEY_SECRET || "";

export function signPayload(payload: string): string {
  return createHmac("sha256", INTEGRATION_KEY).update(payload).digest("hex");
}

export function verifyPayload(payload: string, signature: string): boolean {
  return createHmac("sha256", INTEGRATION_KEY).update(payload).digest("hex") === signature;
}
