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
    <main className="flex-1" style={{ background: "#F9FAFB" }}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-10 py-8">
        <header className="animate-fade-up flex flex-col gap-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#6B7280]"
            style={{ fontFamily: "var(--font-mono)" }}>Integrations</p>
          <h1 className="text-[32px] tracking-[-0.02em] text-[#0B1437]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>All integrations</h1>
          <p className="text-[13.5px] text-[#6B7280]">
            View every configured external integration across all jobs.
          </p>
        </header>

        {integrations.length === 0 ? (
          <div className="animate-fade-up animate-fade-up-delay-1 rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center">
            <Webhook className="mx-auto h-9 w-9 text-[#6B7280]" />
            <p className="mt-3 text-[13px] text-[#6B7280]">
              No integrations configured yet. Add them from each job&apos;s integrations tab.
            </p>
          </div>
        ) : (
          <div className="animate-fade-up animate-fade-up-delay-1 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>Job</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>Trigger stage</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>Endpoint</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>Status</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>Last result</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => {
                  const lastLog = integration.logs[0];
                  return (
                    <tr key={integration.id} className="border-b border-[rgba(9,21,64,0.06)] transition-colors hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3.5">
                        <a
                          href={`/admin/jobs/${integration.job.id}/integrations`}
                          className="text-[13.5px] font-medium text-[#0B1437] hover:text-[#2B4BFF]"
                        >
                          {integration.job.title}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#374151]">
                        {integration.stage.name}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate text-[12px] text-[#6B7280]"
                        style={{ fontFamily: "var(--font-mono)" }}>
                        {integration.endpointUrl}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#059669]">
                          <span className={`inline-flex h-2 w-2 rounded-full ${integration.active ? "bg-[#059669]" : "bg-[#E5E7EB]"}`} />
                          Active
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
