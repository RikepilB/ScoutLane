import { prisma } from "@/lib/db/prisma";
import { Webhook } from "lucide-react";
import { notFound } from "next/navigation";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

export const dynamic = "force-dynamic";

export default async function GlobalIntegrationsPage() {
  const user = await getCurrentUserWithOrganization();
  if (!user?.organizationId || user.role === "GUEST") notFound();

  const integrations = await prisma.jobIntegration.findMany({
    where: { job: { organizationId: user.organizationId } },
    include: {
      job: { select: { id: true, title: true, slug: true } },
      stage: { select: { name: true } },
      logs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="flex-1" style={{ background: "#f1f5f9" }}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-10 py-8">
        <header className="animate-fade-up flex flex-col gap-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#5f8ea0]"
            style={{ fontFamily: "var(--font-mono)" }}>Integrations</p>
          <h1 className="text-[32px] tracking-[-0.02em] text-[#0c1529]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>All integrations</h1>
          <p className="text-[13.5px] text-[#5f8ea0]">
            View every configured external integration across all jobs.
          </p>
        </header>

        {integrations.length === 0 ? (
          <div className="animate-fade-up animate-fade-up-delay-1 rounded-2xl border border-dashed border-[#d4d9df] bg-white p-10 text-center">
            <Webhook className="mx-auto h-9 w-9 text-[#5f8ea0]" />
            <p className="mt-3 text-[13px] text-[#5f8ea0]">
              No integrations configured yet. Add them from each job&apos;s integrations tab.
            </p>
          </div>
        ) : (
          <div className="animate-fade-up animate-fade-up-delay-1 overflow-hidden rounded-2xl border border-[#d4d9df] bg-white shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#d4d9df]">
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                    style={{ fontFamily: "var(--font-mono)" }}>Job</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                    style={{ fontFamily: "var(--font-mono)" }}>Trigger stage</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                    style={{ fontFamily: "var(--font-mono)" }}>Endpoint</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                    style={{ fontFamily: "var(--font-mono)" }}>Status</th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                    style={{ fontFamily: "var(--font-mono)" }}>Last result</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => {
                  const lastLog = integration.logs[0];
                  return (
                    <tr key={integration.id} className="border-b border-[rgba(9,21,64,0.06)] transition-colors hover:bg-[#f1f5f9]">
                      <td className="px-4 py-3.5">
                        <a
                          href={`/admin/jobs/${integration.job.id}/integrations`}
                          className="text-[13.5px] font-medium text-[#0c1529] hover:text-[#1B2CC1]"
                        >
                          {integration.job.title}
                        </a>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#394050]">
                        {integration.stage.name}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate text-[12px] text-[#5f8ea0]"
                        style={{ fontFamily: "var(--font-mono)" }}>
                        {integration.endpointUrl}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2d8a6a]">
                          <span className={`inline-flex h-2 w-2 rounded-full ${integration.active ? "bg-[#2d8a6a]" : "bg-[#d4d9df]"}`} />
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
