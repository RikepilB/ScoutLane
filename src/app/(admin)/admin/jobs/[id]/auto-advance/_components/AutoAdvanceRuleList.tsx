"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Rule {
  id: string;
  thresholdScore: number;
  active: boolean;
  sourceStage: { name: string };
  targetStage: { name: string };
}

interface AutoAdvanceRuleListProps {
  rules: Rule[];
}

export function AutoAdvanceRuleList({ rules }: AutoAdvanceRuleListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No auto-advance rules configured yet.
      </div>
    );
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/jobs/auto-advance/${id}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Could not delete the rule.");
          return;
        }
        toast.success("Rule deleted.");
        router.refresh();
      } catch {
        toast.error("Could not delete the rule. Check your connection.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2 w-2 rounded-full ${rule.active ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="text-sm text-slate-900">
              <span className="font-medium">{rule.sourceStage.name}</span>
              {" → "}
              <span className="font-medium">{rule.targetStage.name}</span>
              {" when score ≥ "}
              <span className="font-medium">{rule.thresholdScore}</span>
            </span>
          </div>
          <button
            onClick={() => handleDelete(rule.id)}
            disabled={isPending}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
            title="Delete rule"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
