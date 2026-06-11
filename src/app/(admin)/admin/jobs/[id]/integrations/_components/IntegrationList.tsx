"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Log {
  id: string;
  event: string;
  status: number;
  requestBody: string | null;
  responseBody: string | null;
  createdAt: string | Date;
}

interface Integration {
  id: string;
  stage: { name: string };
  endpointUrl: string;
  active: boolean;
  includeQuestions: boolean;
  lastSuccessAt: string | Date | null;
  lastFailureAt: string | Date | null;
  failureCount: number;
  logs: Log[];
}

interface IntegrationListProps {
  integrations: Integration[];
}

export function IntegrationList({ integrations }: IntegrationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (integrations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No integrations configured. Add one to trigger API calls on stage transitions.
      </div>
    );
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/jobs/integrations/${id}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Could not delete the integration.");
          return;
        }
        toast.success("Integration deleted.");
        router.refresh();
      } catch {
        toast.error("Could not delete the integration. Check your connection.");
      }
    });
  }

  async function postAction(integrationId: string, action: "test" | "retry") {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/jobs/integrations/${integrationId}?action=${action}`, {
          method: "POST",
        });
        if (!res.ok) {
          toast.error(action === "test" ? "Test call failed to send." : "Retry failed to send.");
          return;
        }
        toast.success(
          action === "test"
            ? "Test call sent. Check the log below for the response."
            : "Retry sent. Check the log below for the response.",
        );
        router.refresh();
      } catch {
        toast.error("Request failed. Check your connection.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <div key={integration.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-2 w-2 rounded-full ${integration.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-sm font-medium text-slate-900">
                  Stage: {integration.stage.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground break-all">{integration.endpointUrl}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {integration.includeQuestions && <span>Includes assessment questions</span>}
                {integration.lastSuccessAt && <span>Last success: {new Date(integration.lastSuccessAt).toLocaleDateString()}</span>}
                {integration.failureCount > 0 && <span className="text-red-600">Failures: {integration.failureCount}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void postAction(integration.id, "test")}
                disabled={isPending}
                className="rounded-lg border border-border/70 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-muted/30 disabled:opacity-50"
              >
                Test payload
              </button>
              <button
                type="button"
                onClick={() => void postAction(integration.id, "retry")}
                disabled={isPending}
                className="rounded-lg border border-border/70 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-muted/30 disabled:opacity-50"
              >
                Retry last
              </button>
              <button
                onClick={() => handleDelete(integration.id)}
                disabled={isPending}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                title="Delete integration"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {integration.logs.length > 0 && (
            <div className="mt-4">
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Recent logs</h5>
              <div className="space-y-1">
                {integration.logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex h-1.5 w-1.5 rounded-full ${log.status < 400 ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className="text-muted-foreground">
                      {log.event} — {log.status}
                    </span>
                    <span className="text-muted-foreground/60">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
