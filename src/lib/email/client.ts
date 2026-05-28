import { Resend } from "resend";

export function getResendClientOrNull(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function getEmailFromOrNull(): string | null {
  const value = process.env.EMAIL_FROM;
  return value && value.trim().length > 0 ? value : null;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.EMAIL_FROM);
}
