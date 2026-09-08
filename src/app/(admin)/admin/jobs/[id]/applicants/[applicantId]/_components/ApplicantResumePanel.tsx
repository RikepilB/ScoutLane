import { FileText } from "lucide-react";

interface ApplicantResumePanelProps {
  resumeUrl: string;
  applicantName: string;
  resumeEmbedSrc: string | null;
  resumeEmbedSandbox: string | undefined;
}

export function ApplicantResumePanel({ resumeUrl, applicantName, resumeEmbedSrc, resumeEmbedSandbox }: ApplicantResumePanelProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Resume</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {resumeEmbedSrc
              ? "Embedded preview with the original file kept available."
              : "This file type cannot be previewed inline. Download or open in a new tab."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-4 py-2 text-xs font-medium text-paper transition hover:bg-ink-800"
          >
            <FileText className="h-3.5 w-3.5" />
            Open in new tab
          </a>
        </div>
      </div>
      {resumeEmbedSrc ? (
        <>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-paper-2">
            <iframe
              title={`${applicantName} resume`}
              src={resumeEmbedSrc}
              sandbox={resumeEmbedSandbox}
              className="h-[720px] w-full bg-surface"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            If the embedded preview does not load, open the resume in a new tab using the button above.
          </p>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-paper p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-mist" />
          <p className="mt-2 text-sm text-steel">
            Preview is not available for this file type.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Word documents (.docx, .doc) must be opened in a compatible application.
          </p>
        </div>
      )}
    </div>
  );
}
