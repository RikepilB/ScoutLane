"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { createApplicantNote, deleteApplicantNote, updateApplicantNote } from "@/server/services/applicants/notes";

interface NoteRow {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string | null } | null;
}

interface NotesSectionProps {
  applicantId: string;
  notes: NoteRow[];
}

export function NotesSection({ applicantId, notes }: NotesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  function handleCreate() {
    const text = draft.trim();
    if (!text) return;
    startTransition(async () => {
      await createApplicantNote(applicantId, text);
      setDraft("");
      router.refresh();
    });
  }

  function startEdit(note: NoteRow) {
    setEditingId(note.id);
    setEditBody(note.body);
  }

  function handleSave(noteId: string) {
    startTransition(async () => {
      await updateApplicantNote(noteId, editBody);
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteApplicantNote(noteId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Admin notes</h3>
      </div>

      <div className="mt-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-border/60 bg-muted/10 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  {editingId === note.id ? (
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border/70 bg-white p-2 text-sm outline-none focus:border-sky-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-900 whitespace-pre-wrap">{note.body}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {note.author?.name ?? "Admin"} ·{" "}
                    {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(note.updatedAt),
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {editingId === note.id ? (
                    <button
                      type="button"
                      onClick={() => handleSave(note.id)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                      title="Save"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(note)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 border-t border-border/60 pt-4">
        <label className="text-xs font-medium text-muted-foreground">Add a note</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-border/60 bg-white p-3 text-sm outline-none focus:border-sky-500"
          placeholder="Interview feedback, follow-ups, or internal context…"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !draft.trim()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add note
        </button>
      </div>
    </div>
  );
}
