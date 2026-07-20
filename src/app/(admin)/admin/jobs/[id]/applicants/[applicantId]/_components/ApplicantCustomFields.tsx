import { ClipboardList } from "lucide-react";

export type ConfiguredCustomField = {
  id: string;
  label: string;
  type?: "text" | "textarea" | "select" | "file";
  required?: boolean;
  options?: string[];
};

interface ApplicantCustomFieldsProps {
  configured: ConfiguredCustomField[];
  submitted: Record<string, string>;
}

/**
 * Renders the job's configured application questions alongside the answers the
 * applicant submitted (`applicant.data.customFields`). Fields are shown in the
 * configured order; unanswered fields render an em-dash placeholder.
 */
export function ApplicantCustomFields({ configured, submitted }: ApplicantCustomFieldsProps) {
  if (configured.length === 0) return null;

  return (
    <section
      aria-labelledby="custom-fields-heading"
      className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
    >
      <h3
        id="custom-fields-heading"
        className="flex items-center gap-2 text-sm font-semibold text-slate-900"
      >
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        Application answers
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {configured.map((field) => {
          const value = submitted[field.id];
          const hasValue = typeof value === "string" && value.trim().length > 0;
          return (
            <div key={field.id}>
              <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
              {hasValue && field.type === "file" ? (
                <a
                  href={value}
                  className="mt-1 inline-block text-sm text-blue-700 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download file
                </a>
              ) : null}
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-900">
                {hasValue ? value : "—"}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
