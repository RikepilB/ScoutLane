"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveCustomFields } from "@/server/services/jobs/update";

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  required: boolean;
  options?: string[];
}

interface FormBuilderPageProps {
  params: Promise<{ id: string }>;
}

function SortableFieldRow({
  field,
  onUpdate,
  onRemove,
}: {
  field: CustomField;
  onUpdate: (id: string, data: Partial<CustomField>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-4"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, { label: e.target.value })}
            placeholder="e.g. Portfolio URL"
            className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Type</label>
          <select
            value={field.type}
            onChange={(e) => onUpdate(field.id, { type: e.target.value as CustomField["type"] })}
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
              Options <span className="font-normal">(one per line)</span>
            </label>
            <textarea
              value={(field.options ?? []).join("\n")}
              onChange={(e) => onUpdate(field.id, { options: e.target.value.split("\n") })}
              rows={3}
              placeholder={"Option A\nOption B\nOption C"}
              className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        )}
        <label className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
            className="rounded border-border text-slate-950 focus:ring-slate-950"
          />
          <span className="text-xs text-muted-foreground">Required</span>
        </label>
        <button
          type="button"
          onClick={() => onRemove(field.id)}
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function FormBuilderPage({ params }: FormBuilderPageProps) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setJobId(p.id);
      fetch(`/api/admin/jobs/${p.id}/form`)
        .then((r) => r.json())
        .then((data) => {
          if (data.customFields) setFields(data.customFields);
        })
        .catch(() => {});
    });
  }, [params]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
      setDirty(true);
    },
    [],
  );

  function addField() {
    const id = crypto.randomUUID();
    setFields([...fields, { id, label: "", type: "text", required: false, options: [] }]);
    setDirty(true);
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
    setDirty(true);
  }

  function updateField(id: string, data: Partial<CustomField>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...data } : f)));
    setDirty(true);
  }

  async function handleSave() {
    if (!jobId) return;
    setSaving(true);
    setSaveError(null);
    const normalized = fields.map((f) =>
      f.type === "select"
        ? { ...f, options: (f.options ?? []).map((o) => o.trim()).filter(Boolean) }
        : f,
    );
    try {
      const result = await saveCustomFields(jobId, normalized);
      if (!result.success) {
        throw new Error(result.error);
      }
      setFields(normalized);
      setDirty(false);
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save custom fields.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">Application form fields</h3>
          <p className="text-sm text-muted-foreground">
            Configure which fields appear on the public job application page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {saveError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </p>
      ) : null}

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Default fields</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Always included in the application form.
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
              Job-specific questions for applicants.
            </p>
          </div>
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add field
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-4 space-y-3">
              {fields.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  onUpdate={updateField}
                  onRemove={removeField}
                />
              ))}
              {fields.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  No custom fields yet. Click &quot;Add field&quot; to create one.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
