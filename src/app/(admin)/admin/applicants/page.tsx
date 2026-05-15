import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { getJobStatus } from "@/lib/jobs";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStageName(stage: { name: string } | null): string {
  return stage?.name ?? "Unassigned";
}

export default async function GlobalApplicantsPage() {
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;

  type ApplicantRow = Prisma.ApplicantGetPayload<{
    include: { job: { select: { id: true; title: true; slug: true } }; stage: { select: { name: true } } };
  }>;

  const applicants: ApplicantRow[] = organizationId
    ? await prisma.applicant.findMany({
        where: { job: { organizationId } },
        include: {
          job: { select: { id: true, title: true, slug: true } },
          stage: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Applicants</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            All applicants
          </h1>
          <p className="text-sm text-muted-foreground">
            {applicants.length} applicant{applicants.length !== 1 ? "s" : ""} across all jobs
          </p>
        </header>

        {applicants.length === 0 ? (
          <EmptyState message="No applicants yet. Applications appear here once candidates submit them." />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Applied</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {applicants.map((a: ApplicantRow) => {
                  const data = a.data as {
                    name?: string;
                    email?: string;
                    education?: Array<{ institution?: string }>;
                  } | null;
                  return (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/jobs/${a.job.id}/applicants/${a.id}`}
                          className="font-medium text-slate-950 underline-offset-2 hover:underline"
                        >
                          {data?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{data?.email ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-700">
                        <Link
                          href={`/admin/jobs/${a.job.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {a.job.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {getStageName(a.stage)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/jobs/${a.job.id}/applicants/${a.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
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
