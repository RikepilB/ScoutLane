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
