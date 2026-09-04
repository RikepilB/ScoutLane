"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateApplicantTags } from "@/server/services/applicants/update";

interface TagsEditorProps {
  applicantId: string;
  tags: string[];
}

export function TagsEditor({ applicantId, tags }: TagsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");

  function commit(next: string[]) {
    startTransition(async () => {
      try {
        await updateApplicantTags(applicantId, next);
        router.refresh();
      } catch {
        toast.error("Could not update tags. Try again.");
      }
    });
  }

  function handleAdd() {
    const value = draft.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setDraft("");
    commit([...tags, value]);
  }

  function handleRemove(tag: string) {
    commit(tags.filter((t) => t !== tag));
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Tags</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                disabled={isPending}
                aria-label={`Remove tag ${tag}`}
                className="text-sky-500 hover:text-sky-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="e.g. Strong yes, Referral"
          maxLength={40}
          className="flex-1 rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs outline-none focus:border-sky-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !draft.trim() || tags.length >= 20}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </div>
      {tags.length >= 20 && (
        <p className="mt-2 text-xs text-muted-foreground">Max 20 tags reached.</p>
      )}
    </div>
  );
}
