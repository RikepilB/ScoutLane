"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface RescoreButtonProps {
  applicantId: string;
  disabled?: boolean;
}

export function RescoreButton({ applicantId, disabled }: RescoreButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/applicants/${applicantId}/rescore`, {
          method: "POST",
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          toast.error(body?.error ?? "Re-scoring failed.");
          return;
        }
        toast.success("Match score updated.");
        router.refresh();
      } catch {
        toast.error("Re-scoring failed. Check your connection and try again.");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      Re-score
    </button>
  );
}
