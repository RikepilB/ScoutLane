"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Globe, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { updateJob } from "@/server/services/jobs/update";
import { deleteJob } from "@/server/services/jobs/delete";

interface JobRowActionsProps {
  jobId: string;
  status: "active" | "draft" | "closed";
}

export function JobRowActions({ jobId, status }: JobRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleTransition(target: "active" | "draft" | "closed") {
    startTransition(async () => {
      const payload =
        target === "active"
          ? { published: true, archived: false }
          : target === "closed"
            ? { published: false, archived: true }
            : { published: false, archived: false };

      await updateJob(jobId, payload);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteJob(jobId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === "draft" && (
        <button
          onClick={() => handleTransition("active")}
          disabled={isPending}
          title="Publish"
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
          Publish
        </button>
      )}
      {status === "active" && (
        <button
          onClick={() => handleTransition("closed")}
          disabled={isPending}
          title="Archive"
          className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 text-[11px] font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Archive className="h-3 w-3" />}
          Archive
        </button>
      )}
      {status === "closed" && (
        <>
          <button
            onClick={() => handleTransition("active")}
            disabled={isPending}
            title="Reopen"
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Reopen
          </button>
          <button
            onClick={() => handleTransition("draft")}
            disabled={isPending}
            title="Set to Draft"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Draft
          </button>
        </>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete"
        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
