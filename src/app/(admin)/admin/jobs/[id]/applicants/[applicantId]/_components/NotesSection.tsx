"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

interface NotesSectionProps {
  applicantId: string;
  initialNotes: string;
}

export function NotesSection({ applicantId, initialNotes }: NotesSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);

  async function handleSave() {
    startTransition(async () => {
      const { updateApplicantNotes } = await import("@/server/services/applicants/update");
      await updateApplicantNotes(applicantId, notes);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="mt-3 w-full rounded-xl border border-border/60 bg-white p-3 text-sm outline-none focus:border-sky-500"
        placeholder="Add notes about this applicant..."
      />
    </div>
  );
}
