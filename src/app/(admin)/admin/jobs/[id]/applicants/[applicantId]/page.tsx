import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { ArrowLeft, Mail, Phone, FileText, Building, GraduationCap, Wrench, RefreshCw, Loader2, Target } from "lucide-react";
import { ApplicantStageActions } from "./_components/ApplicantStageActions";
import { ApplicantStatusBadge } from "@/components/admin/ApplicantStatusBadge";
import { NotesSection } from "./_components/NotesSection";
import { RetryParsingButton } from "./_components/RetryParsingButton";
import { RescoreButton } from "./_components/RescoreButton";
import { ApplicantResumeDataEditor } from "./_components/ApplicantResumeDataEditor";
import { DeleteApplicantButton } from "./_components/DeleteApplicantButton";
import { InterviewDatePicker } from "@/components/applicants/InterviewDatePicker";

function matchBadgeColor(score: number | null): string {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 0.75) return "bg-emerald-50 text-emerald-700";
  if (score >= 0.5) return "bg-amber-50 text-amber-700";
  if (score >= 0.3) return "bg-slate-100 text-slate-600";
  return "bg-red-50 text-red-700";
}

function getAppBaseUrl(): string {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const baseUrl = /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;
  return baseUrl.replace(/\/$/, "");
}

function getResumeEmbedSrc(resumeUrl: string): string {
  const pathOnly = (() => {
    try {
      return new URL(resumeUrl, getAppBaseUrl()).pathname;
    } catch {
      return resumeUrl;
    }
  })();
  const canEmbedDirectly = /\.(pdf|csv|txt)$/i.test(pathOnly);

  if (canEmbedDirectly) {
    return resumeUrl;
  }

  const absoluteResumeUrl = new URL(resumeUrl, getAppBaseUrl()).toString();
  return `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteResumeUrl)}&embedded=true`;
}

interface ApplicantDetailPageProps {
  params: Promise<{ id: string; applicantId: string }>;
}

export default async function ApplicantDetailPage({ params }: ApplicantDetailPageProps) {
  const { id: jobId, applicantId } = await params;

  const currentUser = await getCurrentUserWithOrganization();
  const organizationId = currentUser?.organizationId;
  if (!organizationId) notFound();
  const isAdmin = currentUser?.role === "ADMIN";

  const applicant = await prisma.applicant.findFirst({
    where: { id: applicantId, jobId, job: { organizationId } },
    include: {
      job: { select: { title: true, slug: true } },
      pipelineStage: { select: { id: true, name: true } },
      noteEntries: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      transitions: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
  });

  if (!applicant) notFound();
  if (applicant.jobId !== jobId) notFound();

  const stages = await prisma.pipelineStage.findMany({
    where: { jobId },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  const parsedData = (applicant.data ?? {}) as {
    education?: { institution: string; degree: string; field: string; graduationYear: string; timePeriod?: string; confidence?: "high" | "medium" | "low" }[];
    work?: { company: string; title: string; duration: string; confidence?: "high" | "medium" | "low" }[];
    skills?: string[];
    skillsConfidence?: "high" | "medium" | "low";
    fullNameConfidence?: "high" | "medium" | "low";
    emailConfidence?: "high" | "medium" | "low";
    phoneConfidence?: "high" | "medium" | "low";
    match?: {
      score: number;
      matchedSkills?: string[];
      missingSkills?: string[];
      rationale?: string;
      scoredAt?: string;
    };
  };

  const matchScorePct =
    applicant.score !== null && applicant.score !== undefined
      ? Math.round(applicant.score * 100)
      : null;
  const hasParsedData = applicant.parsingStatus === "COMPLETED";
  const resumeEmbedSrc = applicant.resumeUrl ? getResumeEmbedSrc(applicant.resumeUrl) : null;

  const confidenceColors: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-red-100 text-red-700",
  };

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

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Interview</h3>
        <div className="mt-3">
          <InterviewDatePicker
            applicantId={applicant.id}
            interviewDate={applicant.interviewDate?.toISOString().slice(0, 16) ?? null}
          />
        </div>
      </div>

      {applicant.resumeUrl && resumeEmbedSrc && (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Resume</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Embedded preview with the original file kept available.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={applicant.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
              >
                <FileText className="h-3.5 w-3.5" />
                Open in new tab
              </a>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-slate-100">
            <iframe
              title={`${applicant.name} resume`}
              src={resumeEmbedSrc}
              className="h-[720px] w-full bg-white"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            If the embedded preview does not load, open the resume in a new tab using the button above.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Target className="h-4 w-4 text-muted-foreground" />
            Match to job
          </h3>
          {hasParsedData && <RescoreButton applicantId={applicant.id} />}
        </div>

        {!hasParsedData ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Not yet scored. Parsing must complete first.
          </p>
        ) : parsedData.match ? (
          <div className="mt-4 space-y-5">
            <div className="flex items-baseline gap-3">
              <div
                className={`inline-flex items-center rounded-2xl px-4 py-2 text-2xl font-semibold ${matchBadgeColor(parsedData.match.score)}`}
              >
                {Math.round(parsedData.match.score * 100)}%
              </div>
              <span className="text-xs text-muted-foreground">
                fit for {applicant.job.title}
              </span>
            </div>

            {parsedData.match.rationale && (
              <p className="rounded-xl border border-border/50 bg-muted/20 p-3 text-sm text-slate-700">
                {parsedData.match.rationale}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Matched skills
                </h4>
                {parsedData.match.matchedSkills && parsedData.match.matchedSkills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsedData.match.matchedSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">None.</p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  Missing skills
                </h4>
                {parsedData.match.missingSkills && parsedData.match.missingSkills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsedData.match.missingSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">None.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Scoring did not produce a result. Click Re-score to try again.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Education
          </h3>
          {parsedData.education && parsedData.education.length > 0 ? (
            <div className="mt-3 space-y-3">
              {parsedData.education.map((edu, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{edu.institution}</div>
                    {edu.confidence && (
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${confidenceColors[edu.confidence]}`}>
                        {edu.confidence}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {edu.degree} in {edu.field} · {edu.graduationYear}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No education data available.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Building className="h-4 w-4 text-muted-foreground" />
            Work experience
          </h3>
          {parsedData.work && parsedData.work.length > 0 ? (
            <div className="mt-3 space-y-3">
              {parsedData.work.map((w, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{w.title}</div>
                    {w.confidence && (
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${confidenceColors[w.confidence]}`}>
                        {w.confidence}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {w.company} · {w.duration}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No work experience data available.</p>
          )}
        </div>
      </div>

      {parsedData.skills && parsedData.skills.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Skills
            {parsedData.skillsConfidence && (
              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${confidenceColors[parsedData.skillsConfidence]}`}>
                {parsedData.skillsConfidence}
              </span>
            )}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {parsedData.skills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Activity timeline</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-slate-900">Application submitted</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(applicant.createdAt)}
              </p>
            </div>
          </div>
          {applicant.transitions.map((t: (typeof applicant.transitions)[number]) => (
            <div key={t.id} className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100">
                <div className="h-2 w-2 rounded-full bg-sky-500" />
              </div>
              <div>
                <p className="text-sm text-slate-900">
                  Moved from <span className="font-medium">{t.fromStage}</span> to{" "}
                  <span className="font-medium">{t.toStage}</span>
                  {t.changedBy?.name && <span> by {t.changedBy.name}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(t.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {applicant.transitions.length === 0 && (
            <p className="text-sm text-muted-foreground">No stage changes yet.</p>
          )}
        </div>
      </div>

      <NotesSection
        applicantId={applicant.id}
        notes={applicant.noteEntries.map((n: (typeof applicant.noteEntries)[number]) => ({
          id: n.id,
          body: n.body,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
          author: n.author,
        }))}
      />

      {isAdmin ? (
        <ApplicantResumeDataEditor applicantId={applicant.id} initialData={applicant.data} />
      ) : null}
    </div>
  );
}
