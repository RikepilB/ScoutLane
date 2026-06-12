"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { createStage, updateStage, deleteStage, reorderStages } from "@/server/services/pipeline/stages";
import { Loader2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  color: string | null;
  order: number;
}

function SortableStageItem({
  stage,
  index,
  editingId,
  onStartEdit,
  onRename,
  onDelete,
  onCancelEdit,
}: {
  stage: Stage;
  index: number;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  onCancelEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: stage.color ?? "#6366f1" }} />
      <span className="text-xs text-muted-foreground">#{index + 1}</span>

      {editingId === stage.id ? (
        <input
          type="text"
          defaultValue={stage.name}
          className="flex-1 rounded-lg border border-border/70 bg-white px-2 py-1 text-sm outline-none focus:border-sky-500"
          onBlur={(e) => {
            // Escape marks the input cancelled; the blur fired by unmounting must not save.
            if (e.currentTarget.dataset.cancelled === "1") return;
            onRename(stage.id, e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            // Enter delegates to blur so rename runs exactly once.
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              e.currentTarget.dataset.cancelled = "1";
              onCancelEdit();
            }
          }}
          autoFocus
        />
      ) : (
        <span className="flex-1 text-sm font-medium text-slate-900">{stage.name}</span>
      )}

      <button type="button" onClick={() => onStartEdit(stage.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => onDelete(stage.id, stage.name)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function StagesManager({ jobId, stages: initialStages }: { jobId: string; stages: Stage[] }) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setStages(initialStages);
  }, [initialStages]);
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const name = newName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await createStage(jobId, name, newColor);
      setNewName("");
      toast.success(`Stage "${name}" added.`);
      router.refresh();
    } catch {
      toast.error("Could not add the stage. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRename(stageId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === stages.find((s) => s.id === stageId)?.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateStage(stageId, { name: trimmed });
      toast.success("Stage renamed.");
      router.refresh();
    } catch {
      toast.error("Could not rename the stage. Try again.");
    } finally {
      setEditingId(null);
    }
  }

  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  function handleDeleteClick(stageId: string, stageName: string) {
    setPendingDelete({ id: stageId, name: stageName });
  }

  async function handleConfirmDelete(reassignToStageName: string) {
    if (!pendingDelete) return;
    const reassignToStatus = reassignToStageName.toUpperCase();
    try {
      await deleteStage(pendingDelete.id, reassignToStatus);
      toast.success(`Stage "${pendingDelete.name}" deleted.`);
      router.refresh();
    } catch {
      toast.error("Could not delete the stage. Try again.");
    } finally {
      setPendingDelete(null);
    }
  }

  function handleCancelDelete() {
    setPendingDelete(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = stages;
    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    setStages(reordered);
    try {
      await reorderStages(reordered.map((s) => ({ id: s.id, order: s.order })));
      router.refresh();
    } catch {
      setStages(previous);
      toast.error("Could not reorder stages. Try again.");
    }
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
                  className={`h-7 w-7 rounded-full border-2 ${newColor === c ? "border-slate-950" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stages.map((stage, i) => (
              <SortableStageItem
                key={stage.id}
                stage={stage}
                index={i}
                editingId={editingId}
                onStartEdit={setEditingId}
                onRename={handleRename}
                onDelete={handleDeleteClick}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
            {stages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                No stages yet. Add your first pipeline stage above.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Delete &quot;{pendingDelete.name}&quot;?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Applicants in this stage will be moved to another stage.
            </p>
            {stages.filter(s => s.id !== pendingDelete.id).length > 0 ? (
              <>
                <label className="mt-4 block text-sm font-medium">
                  Move applicants to:
                  <select
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    defaultValue={stages.find(s => s.id !== pendingDelete.id)?.name ?? ""}
                    id="reassign-stage-select"
                  >
                    {stages.filter(s => s.id !== pendingDelete.id).map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={handleCancelDelete} className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium hover:bg-muted/20">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById("reassign-stage-select") as HTMLSelectElement;
                      handleConfirmDelete(select.value);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Delete & move
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-amber-600">This is the last stage. Deleting it will not affect existing applicants.</p>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={handleCancelDelete} className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium hover:bg-muted/20">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(pendingDelete.name)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
