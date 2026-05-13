"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, Archive, RotateCcw, FileEdit } from "lucide-react";
import { updateJob } from "@/server/services/jobs/update";

interface JobStatusActionsProps {
  jobId: string;
  status: "active" | "draft" | "closed";
}

export function JobStatusActions({ jobId, status }: JobStatusActionsProps) {
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

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <button
          onClick={() => handleTransition("active")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
          Publish
        </button>
      )}
      {status === "active" && (
        <button
          onClick={() => handleTransition("closed")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Reopen
          </button>
          <button
            onClick={() => handleTransition("draft")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileEdit className="h-3 w-3" />}
            Set to Draft
          </button>
        </>
      )}
    </div>
  );
}
