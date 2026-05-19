import { getResendClient, getRequiredEnv } from "./client";

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

export async function sendApplicationConfirmationEmail({
  applicantName,
  jobTitle,
  to,
}: ApplicationConfirmationEmailInput) {
  const resend = getResendClient();
  const safeName = escapeHtml(applicantName);
  const safeJobTitle = escapeHtml(jobTitle);

  return resend.emails.send({
    from: getRequiredEnv("EMAIL_FROM"),
    to,
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
  });
}

export async function sendJobAlertConfirmation(to: string, token: string): Promise<void> {
  const resend = getResendClient();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubUrl = `${APP_URL}/api/public/job-alerts?token=${token}`;

  await resend.emails.send({
    from: getRequiredEnv("EMAIL_FROM"),
    to,
    subject: "Job alert confirmed — ScoutLane",
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#1d4ed8;">ScoutLane Job Alert</h2>
      <p>You are now subscribed to new job notifications from ScoutLane.</p>
      <p>We will email you when new positions are posted.</p>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
      </p>
    </body></html>`,
  });
}

export async function sendNewJobNotification(
  to: string,
  jobTitle: string,
  jobUrl: string,
  token: string,
): Promise<void> {
  const resend = getResendClient();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubUrl = `${APP_URL}/api/public/job-alerts?token=${token}`;

  await resend.emails.send({
    from: getRequiredEnv("EMAIL_FROM"),
    to,
    subject: `New job: ${jobTitle} — ScoutLane`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">
      <h2 style="color:#1d4ed8;">New Position at ScoutLane</h2>
      <p><strong>${escapeHtml(jobTitle)}</strong></p>
      <p><a href="${jobUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View job</a></p>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
      </p>
    </body></html>`,
  });
}
