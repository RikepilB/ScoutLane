"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createStage, updateStage, deleteStage } from "@/server/services/pipeline";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  color: string | null;
  order: number;
}

export function StagesManager({ jobId, stages: initialStages }: { jobId: string; stages: Stage[] }) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    await createStage(jobId, newName.trim(), newColor);
    setNewName("");
    router.refresh();
  }

  async function handleRename(stageId: string, name: string) {
    await updateStage(stageId, { name });
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(stageId: string) {
    await deleteStage(stageId);
    router.refresh();
  }

  const presetColors = [
    "#6366f1", "#f59e0b", "#3b82f6", "#10b981",
    "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Add stage</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Phone Screen"
              className="w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Color</label>
            <div className="flex gap-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${
                    newColor === c ? "border-slate-950" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: stage.color ?? "#6366f1" }}
            />
            <span className="text-xs text-muted-foreground">#{i + 1}</span>

            {editingId === stage.id ? (
              <input
                type="text"
                defaultValue={stage.name}
                className="flex-1 rounded-lg border border-border/70 bg-white px-2 py-1 text-sm outline-none focus:border-sky-500"
                onBlur={(e) => handleRename(stage.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(stage.id, (e.target as HTMLInputElement).value);
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-slate-900">{stage.name}</span>
            )}

            <button
              type="button"
              onClick={() => setEditingId(stage.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(stage.id)}
              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {stages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No stages yet. Add your first pipeline stage above.
          </div>
        )}
      </div>
    </div>
  );
}
