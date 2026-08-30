"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface AutoAdvanceRuleFormProps {
  jobId: string;
  stages: Stage[];
}

export function AutoAdvanceRuleForm({ jobId, stages }: AutoAdvanceRuleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [sourceStageId, setSourceStageId] = useState(stages[0]?.id ?? "");
  const [targetStageId, setTargetStageId] = useState(stages[1]?.id ?? stages[0]?.id ?? "");
  const [thresholdScore, setThresholdScore] = useState("0.7");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/jobs/${jobId}/auto-advance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceStageId,
            targetStageId,
            thresholdScore: Number(thresholdScore),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Could not save the rule.");
          return;
        }
        toast.success("Auto-advance rule added.");
        setShowForm(false);
        router.refresh();
      } catch {
        toast.error("Could not save the rule. Check your connection.");
      }
    });
  }

  if (stages.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Add at least two pipeline stages before configuring auto-advance.
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Add rule
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
      <h4 className="text-sm font-semibold text-slate-900">New auto-advance rule</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">When in stage</label>
          <select
            value={sourceStageId}
            onChange={(e) => setSourceStageId(e.target.value)}
            className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
            required
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Move to stage</label>
          <select
            value={targetStageId}
            onChange={(e) => setTargetStageId(e.target.value)}
            className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
            required
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          When match score is at least (0–1)
        </label>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={thresholdScore}
          onChange={(e) => setThresholdScore(e.target.value)}
          className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500 sm:w-40"
          required
        />
      </div>
      <p className="text-xs text-muted-foreground">
        The move to stage must come after the source stage in pipeline order.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
