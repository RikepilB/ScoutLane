"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

interface RetryParsingButtonProps {
  applicantId: string;
  status: string | null;
}

export function RetryParsingButton({ applicantId, status }: RetryParsingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "COMPLETED") return null;

  function handleRetry() {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/jobs/parse-retry/${applicantId}?mode=inline`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error ?? "Resume parsing failed.");
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleRetry}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        {status === "FAILED" ? "Retry parsing" : "Parse now"}
      </button>
      {error && <span className="max-w-xs text-xs text-red-700">{error}</span>}
    </span>
  );
}
