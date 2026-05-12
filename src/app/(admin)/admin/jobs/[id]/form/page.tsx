"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  required: boolean;
}

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>([]);

  function addField() {
    const id = crypto.randomUUID();
    setFields([...fields, { id, label: "", type: "text", required: false }]);
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
  }

  function updateField(id: string, data: Partial<CustomField>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...data } : f)));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Default fields</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          These standard fields are always included in the application form.
        </p>
        <ul className="mt-4 space-y-2">
          {["First Name", "Last Name", "Email", "Phone", "Resume (file upload)"].map((f) => (
            <li key={f} className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm text-slate-700">
              <span className="text-muted-foreground">●</span>
              {f}
              <span className="ml-auto text-[11px] text-muted-foreground">required</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Custom fields</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add job-specific questions (e.g. portfolio link, years of experience).
            </p>
          </div>
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add field
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-4"
            >
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-1 flex-wrap items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="e.g. Portfolio URL"
                    className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                    className="rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="file">File</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="rounded border-border text-slate-950 focus:ring-slate-950"
                  />
                  <span className="text-xs text-muted-foreground">Required</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              No custom fields yet. Click &quot;Add field&quot; to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
