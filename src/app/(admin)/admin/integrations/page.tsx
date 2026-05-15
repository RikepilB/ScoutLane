import { prisma } from "@/lib/db/prisma";
import { Webhook } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GlobalIntegrationsPage() {
  const integrations = await prisma.jobIntegration.findMany({
    include: {
      job: { select: { id: true, title: true, slug: true } },
      stage: { select: { name: true } },
      logs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Integrations
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              All integrations
            </h1>
            <p className="text-sm text-muted-foreground">
              View every configured external integration across all jobs.
            </p>
          </div>
        </header>

        {integrations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-10 text-center">
            <Webhook className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No integrations configured yet. Add them from each job&apos;s integrations tab.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="px-5 py-3 font-medium">Trigger stage</th>
                  <th className="px-5 py-3 font-medium">Endpoint</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {integrations.map((integration) => {
                  const lastLog = integration.logs[0];
                  return (
                    <tr key={integration.id} className="hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <a
                          href={`/admin/jobs/${integration.job.id}/integrations`}
                          className="font-medium text-slate-950 hover:underline"
                        >
                          {integration.job.title}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {integration.stage.name}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                        {integration.endpointUrl}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            integration.active ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          <span
                            className={`inline-flex h-2 w-2 rounded-full ${
                              integration.active ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          {integration.active ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {lastLog ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs ${
                              lastLog.status < 400 ? "text-emerald-700" : "text-red-600"
                            }`}
                          >
                            <span
                              className={`inline-flex h-1.5 w-1.5 rounded-full ${
                                lastLog.status < 400 ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {lastLog.status} —{" "}
                            {new Date(lastLog.createdAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No logs yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
