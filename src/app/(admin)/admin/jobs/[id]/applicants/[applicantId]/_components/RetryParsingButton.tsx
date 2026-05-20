"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

interface RetryParsingButtonProps {
  applicantId: string;
  status: string | null;
}

export function RetryParsingButton({ applicantId, status }: RetryParsingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "COMPLETED") return null;

  function handleRetry() {
    startTransition(async () => {
      await fetch(`/api/admin/jobs/parse-retry/${applicantId}?mode=inline`, { method: "POST" });
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRetry}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      {status === "FAILED" ? "Retry parsing" : "Parse now"}
    </button>
  );
}
