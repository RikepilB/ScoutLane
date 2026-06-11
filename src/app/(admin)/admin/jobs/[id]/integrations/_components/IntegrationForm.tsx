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

interface IntegrationFormProps {
  jobId: string;
  stages: Stage[];
}

export function IntegrationForm({ jobId, stages }: IntegrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [includeQuestions, setIncludeQuestions] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/jobs/${jobId}/integrations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId, endpointUrl, apiKey, includeQuestions }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Could not save the integration.");
          return;
        }
        toast.success("Integration added.");
        setShowForm(false);
        setEndpointUrl("");
        setApiKey("");
        router.refresh();
      } catch {
        toast.error("Could not save the integration. Check your connection.");
      }
    });
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Add integration
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
      <h4 className="text-sm font-semibold text-slate-900">New integration</h4>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Pipeline stage</label>
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
          required
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Endpoint URL</label>
        <input
          type="url"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          placeholder="https://webhook.site/..."
          className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted-foreground">API key (Bearer token)</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full rounded-lg border border-border/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={includeQuestions}
          onChange={(e) => setIncludeQuestions(e.target.checked)}
          className="rounded border-border text-slate-950 focus:ring-slate-950"
        />
        <span className="text-xs text-muted-foreground">Include assessment questions in payload</span>
      </label>

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
