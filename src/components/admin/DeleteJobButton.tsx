"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteJob } from "@/server/services/jobs/delete";

interface DeleteJobButtonProps {
  jobId: string;
  redirectTo?: string;
}

export function DeleteJobButton({ jobId, redirectTo }: DeleteJobButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this job? All applicants and data will be permanently removed.")) return;
    startTransition(async () => {
      await deleteJob(jobId);
      router.push(redirectTo ?? "/admin/jobs");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      Delete
    </button>
  );
}
