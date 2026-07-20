"use client";

import { useState } from "react";
import type { CustomFieldRow } from "./template-data";

interface TemplateCustomFieldsSectionProps {
  initialCustomFields: unknown;
}

export function TemplateCustomFieldsSection({ initialCustomFields }: TemplateCustomFieldsSectionProps) {
  const [customFields, setCustomFields] = useState<CustomFieldRow[]>(() => {
    if (!Array.isArray(initialCustomFields)) return [];
    return initialCustomFields as CustomFieldRow[];
  });

  return (
    <>
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
                  <option value="file">File upload</option>
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
    </>
  );
}
