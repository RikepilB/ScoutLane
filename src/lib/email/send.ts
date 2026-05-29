import { prisma } from "@/lib/db/prisma";
import { getEmailFromOrNull, getResendClientOrNull } from "./client";

const SKIP_REASON = "RESEND_API_KEY or EMAIL_FROM not configured";

export type EmailSendResult =
  | { ok: true; skipped: false; id: string }
  | { ok: false; skipped: true; error?: undefined }
  | { ok: false; skipped: false; error: string };

interface ResendErrorLike {
  message?: string;
  name?: string;
  statusCode?: number;
}

const MAX_ERROR_LENGTH = 500;
const SECRET_PATTERNS: ReadonlyArray<RegExp> = [
  /sk-[A-Za-z0-9_-]{16,}/g,
  /re_[A-Za-z0-9_-]{16,}/g,
  /ghp_[A-Za-z0-9_-]{16,}/g,
  /Bearer\s+[A-Za-z0-9._-]{16,}/gi,
  /(api[_-]?key|token|secret|password)[\s:=]+[A-Za-z0-9._-]{8,}/gi,
];

function scrubSecrets(value: string): string {
  let scrubbed = value;
  for (const pattern of SECRET_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, "[REDACTED]");
  }
  return scrubbed;
}

function truncate(value: string): string {
  if (value.length <= MAX_ERROR_LENGTH) return value;
  return `${value.slice(0, MAX_ERROR_LENGTH)}… [truncated]`;
}

function stringifyError(error: unknown): string {
  let raw: string;
  if (!error) raw = "Unknown email provider error";
  else if (typeof error === "string") raw = error;
  else if (error instanceof Error) raw = error.message || error.name || "Error";
  else if (typeof error === "object") {
    const e = error as ResendErrorLike;
    raw = e.message ?? `Email provider error${e.statusCode ? ` (HTTP ${e.statusCode})` : ""}`;
  } else {
    raw = String(error);
  }
  return truncate(scrubSecrets(raw));
}

async function logSent(to: string, subject: string): Promise<void> {
  await prisma.emailLog
    .create({ data: { to, subject, status: 200, error: null } })
    .catch((err) => console.error("[email] failed to log sent email:", err));
}

async function logFailed(to: string, subject: string, error: string): Promise<void> {
  await prisma.emailLog
    .create({ data: { to, subject, status: 0, error } })
    .catch((err) => console.error("[email] failed to log failed email:", err));
}

async function logSkipped(to: string, subject: string): Promise<void> {
  await prisma.emailLog
    .create({ data: { to, subject, status: 0, error: `SKIPPED: ${SKIP_REASON}` } })
    .catch((err) => console.error("[email] failed to log skipped email:", err));
}

interface DeliverInput {
  to: string;
  subject: string;
  html: string;
}

function sanitizeSubject(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

async function deliver({ to, subject, html }: DeliverInput): Promise<EmailSendResult> {
  const resend = getResendClientOrNull();
  const from = getEmailFromOrNull();
  const safeSubject = sanitizeSubject(subject);

  if (!resend || !from) {
    console.warn(`[email] skipping send to ${to}: ${SKIP_REASON}`);
    await logSkipped(to, safeSubject);
    return { ok: false, skipped: true };
  }

  try {
    const result = await resend.emails.send({ from, to, subject: safeSubject, html });
    if (result.error) {
      const errorMessage = stringifyError(result.error);
      console.error(`[email] resend returned error for ${to}: ${errorMessage}`);
      await logFailed(to, safeSubject, errorMessage);
      return { ok: false, skipped: false, error: errorMessage };
    }
    const id = result.data?.id;
    if (!id) {
      const errorMessage = "Resend returned no data and no error";
      await logFailed(to, safeSubject, errorMessage);
      return { ok: false, skipped: false, error: errorMessage };
    }
    await logSent(to, safeSubject);
    return { ok: true, skipped: false, id };
  } catch (err) {
    const errorMessage = stringifyError(err);
    console.error(`[email] resend threw for ${to}: ${errorMessage}`);
    await logFailed(to, safeSubject, errorMessage);
    return { ok: false, skipped: false, error: errorMessage };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ApplicationConfirmationEmailInput {
  applicantName: string;
  jobTitle: string;
  to: string;
}

export function buildApplicationConfirmationEmail({
  applicantName,
  jobTitle,
}: Omit<ApplicationConfirmationEmailInput, "to">): { subject: string; html: string } {
  const safeName = escapeHtml(applicantName);
  const safeJobTitle = escapeHtml(jobTitle);
  return {
    subject: `Application received for ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
        <p style="font-size:14px;color:#4b5563;margin:0 0 16px">ScoutLane</p>
        <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px">Application received</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 12px">Hi ${safeName},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 12px">
          We received your application for <strong>${safeJobTitle}</strong>.
        </p>
        <p style="font-size:16px;line-height:1.6;margin:0">
          Our team will review your submission and follow up if there is a next step.
        </p>
      </div>
    `,
  };
}

export async function sendApplicationConfirmationEmail({
  applicantName,
  jobTitle,
  to,
}: ApplicationConfirmationEmailInput): Promise<EmailSendResult> {
  const { subject, html } = buildApplicationConfirmationEmail({ applicantName, jobTitle });
  return deliver({ to, subject, html });
}

export async function sendJobAlertConfirmation(
  to: string,
  token: string,
): Promise<EmailSendResult> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubUrl = `${APP_URL}/api/public/job-alerts?token=${token}`;
  const subject = "Job alert confirmed — ScoutLane";
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#1d4ed8;">ScoutLane Job Alert</h2>
      <p>You are now subscribed to new job notifications from ScoutLane.</p>
      <p>We will email you when new positions are posted.</p>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
      </p>
    </body></html>`;
  return deliver({ to, subject, html });
}

export async function sendNewJobNotification(
  to: string,
  jobTitle: string,
  jobUrl: string,
  token: string,
): Promise<EmailSendResult> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubUrl = `${APP_URL}/api/public/job-alerts?token=${token}`;
  const subject = `New job: ${jobTitle} — ScoutLane`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#1d4ed8;">New Position at ScoutLane</h2>
      <p><strong>${escapeHtml(jobTitle)}</strong></p>
      <p><a href="${jobUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View job</a></p>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
      </p>
    </body></html>`;
  return deliver({ to, subject, html });
}

export interface StatusChangeEmailInput {
  to: string;
  subject: string;
  bodyHtml: string;
}

export async function sendCustomEmail({
  to,
  subject,
  bodyHtml,
}: StatusChangeEmailInput): Promise<EmailSendResult> {
  return deliver({ to, subject, html: bodyHtml });
}

export interface AdminNewApplicationEmailInput {
  to: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  jobUrl: string;
}

export async function sendAdminNewApplicationEmail({
  to,
  jobTitle,
  applicantName,
  applicantEmail,
  jobUrl,
}: AdminNewApplicationEmailInput): Promise<EmailSendResult> {
  const subject = `New application: ${applicantName} → ${jobTitle}`;
  const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
        <p style="font-size:14px;color:#4b5563;margin:0 0 16px">ScoutLane · New application</p>
        <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${escapeHtml(applicantName)} applied for ${escapeHtml(jobTitle)}</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(applicantEmail)}</p>
        <p style="margin:18px 0 0">
          <a href="${jobUrl}" style="display:inline-block;background:#1B2CC1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">Open in dashboard</a>
        </p>
      </div>
    `;
  return deliver({ to, subject, html });
}
