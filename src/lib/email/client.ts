import { Resend } from "resend";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getResendClient(): Resend {
  return new Resend(getRequiredEnv("RESEND_API_KEY"));
}

export { getRequiredEnv };
