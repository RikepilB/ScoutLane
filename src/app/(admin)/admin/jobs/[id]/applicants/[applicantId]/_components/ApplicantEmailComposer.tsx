"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, Send, Eye, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendApplicantEmail } from "@/server/services/emails/send-applicant";

type TemplateKey =
  | "custom"
  | "shortlisted"
  | "interview"
  | "offered"
  | "rejected"
  | "follow_up";

interface TemplateDef {
  label: string;
  subject: (jobTitle: string, applicantName: string) => string;
  body: (jobTitle: string, applicantName: string) => string;
}

const TEMPLATES: Record<TemplateKey, TemplateDef> = {
  custom: {
    label: "Blank message",
    subject: () => "",
    body: () => "",
  },
  shortlisted: {
    label: "Shortlisted",
    subject: (jobTitle) => `You have been shortlisted for ${jobTitle}`,
    body: (jobTitle, applicantName) =>
      `<p>Hi ${escape(applicantName)},</p>
<p>Great news — we have moved your application for <strong>${escape(jobTitle)}</strong> forward to our shortlist.</p>
<p>The hiring team will be in touch shortly with the next step. In the meantime, let us know if there is anything we can share about the role.</p>
<p>Thanks for your patience.<br/>ScoutLane Hiring Team</p>`,
  },
  interview: {
    label: "Invite to interview",
    subject: (jobTitle) => `Interview invitation for ${jobTitle}`,
    body: (jobTitle, applicantName) =>
      `<p>Hi ${escape(applicantName)},</p>
<p>We would love to set up an interview for the <strong>${escape(jobTitle)}</strong> role. Please reply with a few time windows that work for you over the next week and we will lock in a slot.</p>
<p>Looking forward to talking.<br/>ScoutLane Hiring Team</p>`,
  },
  offered: {
    label: "Offer",
    subject: (jobTitle) => `Offer: ${jobTitle}`,
    body: (jobTitle, applicantName) =>
      `<p>Hi ${escape(applicantName)},</p>
<p>We are excited to extend an offer for the <strong>${escape(jobTitle)}</strong> role. The full offer document is on its way separately.</p>
<p>Let us know if you have any questions — happy to jump on a call.</p>
<p>Welcome aboard (we hope!).<br/>ScoutLane Hiring Team</p>`,
  },
  rejected: {
    label: "Decline",
    subject: (jobTitle) => `Update on your ${jobTitle} application`,
    body: (jobTitle, applicantName) =>
      `<p>Hi ${escape(applicantName)},</p>
<p>Thanks again for applying for the <strong>${escape(jobTitle)}</strong> role and for the time you put into the process.</p>
<p>After careful review we have decided to move forward with other candidates whose experience more closely matches what we are looking for right now. We will keep your profile on file and reach out if a more suitable role opens up.</p>
<p>Wishing you the best,<br/>ScoutLane Hiring Team</p>`,
  },
  follow_up: {
    label: "Follow-up / status update",
    subject: (jobTitle) => `Quick update on your ${jobTitle} application`,
    body: (jobTitle, applicantName) =>
      `<p>Hi ${escape(applicantName)},</p>
<p>Wanted to share a quick update on your application for <strong>${escape(jobTitle)}</strong> — we are still reviewing and will be back in touch within the next few business days with a clearer next step.</p>
<p>Thanks for your patience.<br/>ScoutLane Hiring Team</p>`,
  },
};

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface Props {
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
}

export function ApplicantEmailComposer({
  applicantId,
  applicantName,
  applicantEmail,
  jobTitle,
}: Props) {
  const [templateKey, setTemplateKey] = useState<TemplateKey>("custom");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [pending, start] = useTransition();

  const previewHtml = useMemo(() => bodyHtml, [bodyHtml]);

  function applyTemplate(key: TemplateKey) {
    const def = TEMPLATES[key];
    setTemplateKey(key);
    if (key === "custom") {
      setSubject("");
      setBodyHtml("");
      return;
    }
    setSubject(def.subject(jobTitle, applicantName));
    setBodyHtml(def.body(jobTitle, applicantName));
  }

  async function handleSend() {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    start(async () => {
      const result = await sendApplicantEmail({
        applicantId,
        subject: subject.trim(),
        bodyHtml,
      });
      if (result.ok) {
        toast.success(`Email sent to ${applicantEmail}`);
        setSubject("");
        setBodyHtml("");
        setTemplateKey("custom");
        setShowPreview(false);
      } else if (result.skipped) {
        toast.warning(result.error ?? "Email skipped — service not configured");
      } else {
        toast.error(result.error ?? "Failed to send email");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Compose email
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Send a status update or custom message to {applicantEmail}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Template</label>
          <select
            value={templateKey}
            onChange={(e) => applyTemplate(e.target.value as TemplateKey)}
            className="rounded-lg border border-border/70 bg-white px-3 py-1.5 text-sm outline-none focus:border-sky-500"
          >
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
              <option key={k} value={k}>
                {TEMPLATES[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
          Subject
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
            disabled={pending}
          />
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Message (HTML supported)
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowPreview((p) => !p)}
            >
              {showPreview ? (
                <>
                  <FileEdit className="h-3.5 w-3.5" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </>
              )}
            </Button>
          </div>
          {showPreview ? (
            <div
              className="min-h-48 rounded-md border border-input bg-background px-4 py-3 text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: previewHtml || "<em>Nothing to preview yet.</em>",
              }}
            />
          ) : (
            <Textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="min-h-48"
              placeholder="<p>Hi…</p>"
              disabled={pending}
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Button onClick={handleSend} disabled={pending}>
          <Send className="h-4 w-4" />
          {pending ? "Sending…" : "Send email"}
        </Button>
      </div>
    </div>
  );
}
