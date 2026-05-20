"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteApplicant } from "@/server/services/applicants/update";

interface DeleteApplicantButtonProps {
  applicantId: string;
  jobId: string;
}

export function DeleteApplicantButton({ applicantId, jobId }: DeleteApplicantButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this applicant permanently? This removes their resume data, notes, and stage history.",
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteApplicant(applicantId);
        router.push(`/admin/jobs/${jobId}/applicants`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete applicant.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Delete applicant
      </button>
      {error ? <p className="max-w-[220px] text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
