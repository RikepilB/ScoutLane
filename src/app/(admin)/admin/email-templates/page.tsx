import { Mail } from "lucide-react";
import { buildApplicationConfirmationEmail } from "@/lib/email/send";
import { isEmailConfigured } from "@/lib/email/client";

export const dynamic = "force-dynamic";

export default function EmailTemplatesPage() {
  const sampleApplicant = "Jordan Lee";
  const sampleJob = "Senior Frontend Engineer";

  const applicantConfirmation = buildApplicationConfirmationEmail({
    applicantName: sampleApplicant,
    jobTitle: sampleJob,
  });

  const adminNotificationHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px">ScoutLane · New application</p>
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">${sampleApplicant} applied for ${sampleJob}</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px"><strong>Email:</strong> jordan.lee@example.com</p>
      <p style="margin:18px 0 0">
        <a href="#" style="display:inline-block;background:#1B2CC1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">Open in dashboard</a>
      </p>
    </div>
  `;

  const configured = isEmailConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-950">
          <Mail className="h-7 w-7 text-muted-foreground" />
          Email templates
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Previews of every transactional email the platform sends. Use this page to QA the
          copy before applicants and admins receive it.
        </p>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm ${
          configured
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {configured ? (
          <>
            <strong>Sending is live.</strong> RESEND_API_KEY and EMAIL_FROM are configured.
          </>
        ) : (
          <>
            <strong>Sending is disabled.</strong> Set <code>RESEND_API_KEY</code> and{" "}
            <code>EMAIL_FROM</code> in your environment to enable transactional email. Until
            then, every send is logged to the <code>EmailLog</code> table with{" "}
            <code>status=0</code> and the reason &quot;SKIPPED&quot;.
          </>
        )}
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">Application confirmation</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sent to the applicant immediately after they submit an application.
          </p>
          <p className="mt-2 text-xs">
            <span className="text-muted-foreground">Subject:</span>{" "}
            <span className="font-medium text-slate-800">{applicantConfirmation.subject}</span>
          </p>
        </header>
        <div className="rounded-xl border border-input bg-white p-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: applicantConfirmation.html }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">Admin: new application</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sent to every admin in the organization when an applicant submits a new application.
          </p>
          <p className="mt-2 text-xs">
            <span className="text-muted-foreground">Subject:</span>{" "}
            <span className="font-medium text-slate-800">
              New application: {sampleApplicant} → {sampleJob}
            </span>
          </p>
        </header>
        <div className="rounded-xl border border-input bg-white p-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: adminNotificationHtml }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">Custom messages</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Status updates, interview invites, offers, and ad-hoc messages are composed from each
            applicant&apos;s profile page. Open an applicant and use the <em>Compose email</em>{" "}
            panel — it ships built-in templates for shortlist, interview, offer, decline, and
            follow-up, all editable before send.
          </p>
        </header>
      </section>
    </div>
  );
}
