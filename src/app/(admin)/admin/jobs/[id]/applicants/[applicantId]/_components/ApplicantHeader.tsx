import Link from "next/link";
import { ArrowLeft, Mail, Phone, FileText, Loader2, RefreshCw, Target } from "lucide-react";
import { ApplicantStatusBadge } from "@/components/admin/ApplicantStatusBadge";
import { ApplicantStageActions } from "./ApplicantStageActions";
import { RetryParsingButton } from "./RetryParsingButton";
import { RescoreButton } from "./RescoreButton";
import { DeleteApplicantButton } from "./DeleteApplicantButton";
import { matchBadgeColor, type ApplicantDetail } from "../_lib/applicant-detail";

interface ApplicantHeaderProps {
  applicant: ApplicantDetail;
  jobId: string;
  stages: { id: string; name: string }[];
  isAdmin: boolean;
  hasParsedData: boolean;
  matchScorePct: number | null;
}

export function ApplicantHeader({ applicant, jobId, stages, isAdmin, hasParsedData, matchScorePct }: ApplicantHeaderProps) {
  return (
    <>
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
                Applied for {applicant.job.title}
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
                    View resume <FileText className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ApplicantStatusBadge status={applicant.status} />
                {applicant.pipelineStage && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800">
                    Stage: {applicant.pipelineStage.name}
                  </span>
                )}
              </div>
              {matchScorePct !== null && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${matchBadgeColor(applicant.score)}`}
                >
                  <Target className="h-3 w-3" />
                  Match: {matchScorePct}%
                </span>
              )}
              {applicant.parsingStatus && applicant.parsingStatus !== "COMPLETED" && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  applicant.parsingStatus === "PARSING"
                    ? "bg-amber-50 text-amber-700"
                    : applicant.parsingStatus === "FAILED"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-600"
                }`}>
                  {applicant.parsingStatus === "PARSING" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {applicant.parsingStatus === "FAILED" && <RefreshCw className="h-3 w-3" />}
                  Resume: {applicant.parsingStatus.charAt(0) + applicant.parsingStatus.slice(1).toLowerCase()}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Applied {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(applicant.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <ApplicantStageActions
              applicantId={applicant.id}
              stages={stages}
              currentStageId={applicant.pipelineStageId}
            />
            <RetryParsingButton applicantId={applicant.id} status={applicant.parsingStatus ?? null} />
            {hasParsedData && <RescoreButton applicantId={applicant.id} />}
            {isAdmin ? <DeleteApplicantButton applicantId={applicant.id} jobId={jobId} /> : null}
          </div>
        </div>
      </div>
    </>
  );
}
