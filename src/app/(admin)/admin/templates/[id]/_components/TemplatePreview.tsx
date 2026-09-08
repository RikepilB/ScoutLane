"use client";

import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";
import { useState } from "react";

type CustomFieldRow = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  options?: string[];
};

interface TemplateData {
  name: string;
  description: string | null;
  title: string;
  jobDescription: string | null;
  location: string | null;
  type: string | null;
  salary: string | null;
  department: string | null;
  whatYouWillDo: string | null;
  requirements: string[] | null;
  toolsAndSkills: string[] | null;
  stageNames: string[];
  questions: unknown;
  customFields: unknown;
}

interface TemplatePreviewProps {
  template: TemplateData;
}

export function TemplatePreviewTrigger({ template }: TemplatePreviewProps) {
  const [open, setOpen] = useState(false);

  const questions = Array.isArray(template.questions)
    ? (template.questions as string[])
    : [];
  const customFields: CustomFieldRow[] = Array.isArray(template.customFields)
    ? (template.customFields as CustomFieldRow[])
    : [];

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-3.5 w-3.5" />
        Preview template
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-ink-950">
                Template preview
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Template info
                </h3>
                <p className="text-xl font-semibold text-ink-950">{template.name}</p>
                {template.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{template.description}</p>
                )}
              </section>

              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Job defaults
                </h3>
                <div className="grid gap-2 text-sm">
                  <div><span className="font-medium">Title:</span> {template.title}</div>
                  {template.location && <div><span className="font-medium">Location:</span> {template.location}</div>}
                  {template.type && <div><span className="font-medium">Type:</span> {template.type}</div>}
                  {template.salary && <div><span className="font-medium">Salary:</span> {template.salary}</div>}
                  {template.department && <div><span className="font-medium">Department:</span> {template.department}</div>}
                </div>
                {template.whatYouWillDo && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">What you&apos;ll do:</span>
                    <pre className="mt-1 max-h-24 overflow-y-auto rounded-lg bg-muted/30 p-3 text-xs text-ink-700 whitespace-pre-wrap">
                      {template.whatYouWillDo}
                    </pre>
                  </div>
                )}
                {template.requirements && template.requirements.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Requirements ({template.requirements.length}):</span>
                    <ul className="mt-1 space-y-0.5">
                      {template.requirements.map((r, i) => (
                        <li key={i} className="text-xs text-ink-700 flex gap-1.5">
                          <span className="text-brand-royal">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {template.toolsAndSkills && template.toolsAndSkills.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Tools &amp; Skills:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {template.toolsAndSkills.map((s, i) => (
                        <span key={i} className="rounded-full border border-peri bg-info-soft px-2 py-0.5 text-[11px] font-medium text-brand-royal">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {template.jobDescription && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Description:</span>
                    <pre className="mt-1 max-h-32 overflow-y-auto rounded-lg bg-muted/30 p-3 text-xs text-ink-700 whitespace-pre-wrap">
                      {template.jobDescription}
                    </pre>
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Pipeline stages ({template.stageNames.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {template.stageNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-ink-800"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Assessment questions ({questions.length})
                </h3>
                {questions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No assessment questions defined.</p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mist text-[11px] font-semibold text-ink-700">
                          {i + 1}
                        </span>
                        <span className="text-ink-700">{q}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Custom form fields ({customFields.length})
                </h3>
                {customFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No custom fields. Jobs will only have name, email, phone, and resume.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm"
                      >
                        <span className="font-medium text-ink-800">{field.label || "(no label)"}</span>
                        <span className="inline-flex rounded bg-mist px-1.5 py-0.5 text-[11px] font-medium uppercase text-ink-700">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="inline-flex rounded bg-warning px-1.5 py-0.5 text-[11px] font-medium text-warning">
                            Required
                          </span>
                        )}
                        {field.type === "select" && field.options && field.options.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Options: {field.options.join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="border-t border-border/50 px-6 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="w-full"
              >
                Close preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
