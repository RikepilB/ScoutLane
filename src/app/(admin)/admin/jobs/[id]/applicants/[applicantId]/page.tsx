import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, ExternalLink, Mail, Phone, FileText } from "lucide-react";
import { ApplicantActions } from "./_components/ApplicantActions";

interface ApplicantDetailPageProps {
  params: Promise<{ id: string; applicantId: string }>;
}

const statusColors: Record<string, string> = {
  NEW: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  REVIEWING: "bg-amber-50 text-amber-700 ring-amber-200",
  SHORTLISTED: "bg-sky-50 text-sky-700 ring-sky-200",
  INTERVIEW: "bg-blue-50 text-blue-700 ring-blue-200",
  OFFERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  WITHDRAWN: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default async function ApplicantDetailPage({ params }: ApplicantDetailPageProps) {
  const { id: jobId, applicantId } = await params;

  const [applicant, job] = await Promise.all([
    prisma.applicant.findUnique({
      where: { id: applicantId },
    }),
    prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, slug: true },
    }),
  ]);

  if (!applicant || !job) notFound();
  if (applicant.jobId !== jobId) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/jobs/${jobId}/applicants`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to applicants
      </Link>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{applicant.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Applied for {job.title}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              {applicant.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${applicant.email}`} className="hover:text-foreground">
                    {applicant.email}
                  </a>
                </div>
              )}
              {applicant.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{applicant.phone}</span>
                </div>
              )}
              {applicant.resumeUrl && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <a
                    href={applicant.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View resume <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ring-inset ${
                  statusColors[applicant.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {applicant.status}
              </span>
              {applicant.score && (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  Score: {applicant.score}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Applied {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(applicant.createdAt)}
              </span>
            </div>
          </div>

          <ApplicantActions applicantId={applicant.id} currentStatus={applicant.status} jobId={jobId} />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {applicant.notes || "No notes recorded for this applicant."}
        </p>
      </div>
    </div>
  );
}
