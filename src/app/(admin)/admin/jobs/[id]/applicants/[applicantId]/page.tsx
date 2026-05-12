import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, ExternalLink, Mail, Phone, FileText } from "lucide-react";
import { ApplicantActions } from "./_components/ApplicantActions";
import { ApplicantStatusBadge } from "@/components/admin/ApplicantStatusBadge";

interface ApplicantDetailPageProps {
  params: Promise<{ id: string; applicantId: string }>;
}

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
              <ApplicantStatusBadge status={applicant.status} />
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
