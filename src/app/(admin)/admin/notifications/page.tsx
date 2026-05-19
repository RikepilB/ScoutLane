import Link from "next/link";
import { Bell, CheckCircle2, FileWarning, MailWarning, Webhook } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function NotificationsPage() {
  const currentUser = await getCurrentUserWithOrganization();
  const organizationId = currentUser?.organizationId;

  const [failedParsing, failedIntegrations, failedEmails] = await Promise.all([
    organizationId
      ? prisma.applicant.findMany({
          where: {
            parsingStatus: "FAILED",
            job: { organizationId },
          },
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: {
            id: true,
            name: true,
            updatedAt: true,
            jobId: true,
            job: { select: { title: true } },
          },
        })
      : [],
    organizationId
      ? prisma.integrationLog.findMany({
          where: {
            OR: [{ status: 0 }, { status: { gte: 400 } }],
            integration: { job: { organizationId } },
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            status: true,
            responseBody: true,
            createdAt: true,
            integration: {
              select: {
                jobId: true,
                stage: { select: { name: true } },
                job: { select: { title: true } },
              },
            },
          },
        })
      : [],
    prisma.emailLog.findMany({
      where: { status: { lt: 200 } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const totalIssues = failedParsing.length + failedIntegrations.length + failedEmails.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
            Operations
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Failed emails, resume parsing retries, and integration delivery issues.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm">
          {totalIssues === 0 ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Bell className="h-4 w-4 text-amber-600" />
          )}
          <span className="font-medium">{totalIssues}</span>
          <span className="text-muted-foreground">open issues</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-slate-900">Resume parsing</h2>
          </div>
          <div className="mt-4 space-y-3">
            {failedParsing.map((applicant) => (
              <Link
                key={applicant.id}
                href={`/admin/jobs/${applicant.jobId}/applicants/${applicant.id}`}
                className="block rounded-xl border border-border/60 bg-slate-50 p-3 transition hover:bg-white"
              >
                <div className="text-sm font-medium text-slate-900">{applicant.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {applicant.job.title} · {formatDate(applicant.updatedAt)}
                </div>
              </Link>
            ))}
            {failedParsing.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground">
                No failed resume parsing jobs.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">Integrations</h2>
          </div>
          <div className="mt-4 space-y-3">
            {failedIntegrations.map((log) => (
              <Link
                key={log.id}
                href={`/admin/jobs/${log.integration.jobId}/integrations`}
                className="block rounded-xl border border-border/60 bg-slate-50 p-3 transition hover:bg-white"
              >
                <div className="text-sm font-medium text-slate-900">
                  {log.integration.job.title} · {log.integration.stage.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  HTTP {log.status} · {formatDate(log.createdAt)}
                </div>
                {log.responseBody ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{log.responseBody}</p>
                ) : null}
              </Link>
            ))}
            {failedIntegrations.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground">
                No failed integration calls.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MailWarning className="h-4 w-4 text-sky-700" />
            <h2 className="text-sm font-semibold text-slate-900">Email delivery</h2>
          </div>
          <div className="mt-4 space-y-3">
            {failedEmails.map((log) => (
              <div key={log.id} className="rounded-xl border border-border/60 bg-slate-50 p-3">
                <div className="text-sm font-medium text-slate-900">{log.to}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {log.subject} · {formatDate(log.createdAt)}
                </div>
                {log.error ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{log.error}</p>
                ) : null}
              </div>
            ))}
            {failedEmails.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground">
                No failed applicant emails.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
