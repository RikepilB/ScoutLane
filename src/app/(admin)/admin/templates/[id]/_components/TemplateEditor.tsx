"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  FileUp,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuestionsEditor } from "./QuestionsEditor";
import { TemplatePreviewTrigger } from "./TemplatePreview";
import { renderMarkdown } from "@/lib/utils/markdown";

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  title: string;
  jobDescription: string | null;
  descriptionUrl: string | null;
  location: string | null;
  type: string | null;
  salary: string | null;
  stageNames: string[];
  questions: unknown;
  customFields: unknown;
}

type CustomFieldRow = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  required: boolean;
  options?: string[];
};

interface TemplateEditorProps {
  template: TemplateData;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}

export function TemplateEditor({
  template,
  updateAction,
  deleteAction,
}: TemplateEditorProps) {
  const [preview, setPreview] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [customFields, setCustomFields] = useState<CustomFieldRow[]>(() => {
    if (!Array.isArray(template.customFields)) return [];
    return template.customFields as CustomFieldRow[];
  });
  const [descMode, setDescMode] = useState<"write" | "link">(
    template.descriptionUrl ? "link" : "write",
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (descRef.current) {
        descRef.current.value = content;
      }
      setFileStatus(`Loaded ${file.name}`);
      setTimeout(() => setFileStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const previewContent = descRef.current?.value ?? template.jobDescription ?? "";

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/admin/templates">
              <ArrowLeft className="h-4 w-4" />
              Templates
            </Link>
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Edit template
              </h1>
              <p className="text-sm text-muted-foreground">
                Update reusable defaults for future jobs created from this template.
              </p>
            </div>
            <TemplatePreviewTrigger template={template} />
          </div>
        </div>
        <form action={deleteAction}>
          <Button type="submit" variant="outline">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>

      <form
        action={updateAction}
        className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Template details
              </h2>
              <p className="text-sm text-muted-foreground">
                These labels help the team pick the right starting point.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Name
                <Input name="name" defaultValue={template.name} required />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Short description
                <Input
                  name="description"
                  defaultValue={template.description ?? ""}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Job defaults
              </h2>
              <p className="text-sm text-muted-foreground">
                These values prefill new jobs and are copied at creation time.
              </p>
            </div>
            <label className="space-y-2 text-sm font-medium">
              Default job title
              <Input name="title" defaultValue={template.title} required />
            </label>

            <div className="space-y-3 text-sm font-medium">
              <div className="flex items-center justify-between">
                <span>Default description</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-normal">
                    <input
                      type="radio"
                      name="descMode"
                      value="write"
                      checked={descMode === "write"}
                      onChange={() => setDescMode("write")}
                    />
                    Write description
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-normal">
                    <input
                      type="radio"
                      name="descMode"
                      value="link"
                      checked={descMode === "link"}
                      onChange={() => setDescMode("link")}
                    />
                    Link to hosted PDF/Google Doc
                  </label>
                </div>
              </div>

              {descMode === "link" ? (
                <>
                  <Input
                    type="url"
                    name="descriptionUrl"
                    placeholder="https://docs.google.com/document/d/..."
                    defaultValue={template.descriptionUrl ?? ""}
                  />
                  <input type="hidden" name="jobDescription" value="" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-end gap-2">
                    {fileStatus ? (
                      <span className="text-xs text-muted-foreground">
                        {fileStatus}
                      </span>
                    ) : null}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".md"
                      className="hidden"
                      onChange={handleFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Upload .md
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreview(!preview)}
                    >
                      {preview ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
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
                  {preview ? (
                    <div className="min-h-48 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {previewContent ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(previewContent),
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground">
                          Nothing to preview
                        </span>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      ref={descRef}
                      name="jobDescription"
                      className="min-h-48"
                      defaultValue={template.jobDescription ?? ""}
                    />
                  )}
                  <input type="hidden" name="descriptionUrl" value="" />
                </>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium">
                Location
                <Input name="location" defaultValue={template.location ?? ""} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Type
                <Input name="type" defaultValue={template.type ?? ""} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Salary
                <Input name="salary" defaultValue={template.salary ?? ""} />
              </label>
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Pipeline stages
              <Textarea
                name="stageNames"
                className="min-h-44"
                defaultValue={template.stageNames.join("\n")}
                required
              />
              <span className="block text-xs font-normal text-muted-foreground">
                One stage per line.
              </span>
            </label>
            <QuestionsEditor defaultValue={template.questions as string[]} />
          </section>

          <input
            type="hidden"
            name="customFields"
            value={JSON.stringify(customFields)}
          />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Custom form fields
                </h2>
                <p className="text-sm text-muted-foreground">
                  These fields are copied onto new jobs created from this
                  template.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCustomFields((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      label: "",
                      type: "text",
                      required: false,
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add field
              </button>
            </div>
            {customFields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No custom fields defined. Fields added here will be pre-populated
                in jobs created from this template.
              </p>
            )}
            {customFields.map((field, idx) => (
              <div
                key={field.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-4"
              >
                <div className="flex flex-1 flex-wrap items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Label
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        setCustomFields((prev) =>
                          prev.map((f, i) =>
                            i === idx ? { ...f, label: e.target.value } : f,
                          ),
                        )
                      }
                      placeholder="e.g. Portfolio URL"
                      className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        setCustomFields((prev) =>
                          prev.map((f, i) =>
                            i === idx
                              ? {
                                  ...f,
                                  type: e.target.value as CustomFieldRow["type"],
                                }
                              : f,
                          ),
                        )
                      }
                      className="rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="file">File</option>
                    </select>
                  </div>
                  {field.type === "select" && (
                    <div className="w-full">
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Options (one per line)
                      </label>
                      <textarea
                        value={(field.options ?? []).join("\n")}
                        onChange={(e) =>
                          setCustomFields((prev) =>
                            prev.map((f, i) =>
                              i === idx
                                ? { ...f, options: e.target.value.split("\n") }
                                : f,
                            ),
                          )
                        }
                        rows={3}
                        placeholder={"Option A\nOption B"}
                        className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        setCustomFields((prev) =>
                          prev.map((f, i) =>
                            i === idx
                              ? { ...f, required: e.target.checked }
                              : f,
                          ),
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      Required
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomFields((prev) =>
                        prev.filter((_, i) => i !== idx),
                      )
                    }
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit">
            <Save className="h-4 w-4" />
            Save template
          </Button>
        </div>
      </form>
    </>
  );
}
