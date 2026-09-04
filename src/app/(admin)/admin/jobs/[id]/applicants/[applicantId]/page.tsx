import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { ApplicantEmailComposer } from "./_components/ApplicantEmailComposer";
import { NotesSection } from "./_components/NotesSection";
import { TagsEditor } from "./_components/TagsEditor";
import { ApplicantResumeDataEditor } from "./_components/ApplicantResumeDataEditor";
import { ApplicantCustomFields, type ConfiguredCustomField } from "./_components/ApplicantCustomFields";
import { InterviewDatePicker } from "@/components/applicants/InterviewDatePicker";
import { getResumePreviewKind } from "@/lib/resume/preview";
import { ApplicantHeader } from "./_components/ApplicantHeader";
import { ApplicantResumePanel } from "./_components/ApplicantResumePanel";
import { ApplicantMatchPanel } from "./_components/ApplicantMatchPanel";
import { ApplicantParsedDataPanels } from "./_components/ApplicantParsedDataPanels";
import { ApplicantTimeline } from "./_components/ApplicantTimeline";
import { getResumeObjectName, getResumePathname } from "./_lib/applicant-detail";

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
      job: { select: { title: true, slug: true, customFields: true } },
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

  const submittedCustomFields =
    (applicant.data as { customFields?: Record<string, string> } | null)?.customFields ?? {};
  const configuredCustomFields = (Array.isArray(applicant.job.customFields)
    ? applicant.job.customFields
    : []) as ConfiguredCustomField[];

  const matchScorePct =
    applicant.score !== null && applicant.score !== undefined
      ? Math.round(applicant.score * 100)
      : null;
  const hasParsedData = applicant.parsingStatus === "COMPLETED";

  // Decide inline preview by the stored MIME type (resume URLs frequently lack
  // a usable extension), falling back to the URL extension for externally
  // hosted files. PDFs/text embed natively; Word documents render through the
  // sanitized HTML preview route.
  const resumeObjectName = applicant.resumeUrl
    ? getResumeObjectName(applicant.resumeUrl)
    : null;
  const resumeFile = resumeObjectName
    ? await prisma.resumeFile.findUnique({
        where: { objectName: resumeObjectName },
        select: { contentType: true },
      })
    : null;
  const resumePreviewKind = applicant.resumeUrl
    ? getResumePreviewKind({
        contentType: resumeFile?.contentType,
        pathname: getResumePathname(applicant.resumeUrl),
      })
    : "none";
  const resumeEmbedSrc =
    resumePreviewKind === "native"
      ? applicant.resumeUrl
      : resumePreviewKind === "docx-html" && resumeObjectName
        ? `/api/resumes/preview/${resumeObjectName}`
        : null;
  const resumeEmbedSandbox = resumePreviewKind === "docx-html" ? "" : undefined;

  return (
    <div className="space-y-6">
      <ApplicantHeader
        applicant={applicant}
        jobId={jobId}
        stages={stages}
        isAdmin={isAdmin}
        hasParsedData={hasParsedData}
        matchScorePct={matchScorePct}
      />

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Interview</h3>
        <div className="mt-3">
          <InterviewDatePicker
            applicantId={applicant.id}
            interviewDate={applicant.interviewDate?.toISOString().slice(0, 16) ?? null}
          />
        </div>
      </div>

      {applicant.resumeUrl && (
        <ApplicantResumePanel
          resumeUrl={applicant.resumeUrl}
          applicantName={applicant.name}
          resumeEmbedSrc={resumeEmbedSrc}
          resumeEmbedSandbox={resumeEmbedSandbox}
        />
      )}

      <ApplicantMatchPanel
        applicantId={applicant.id}
        jobTitle={applicant.job.title}
        hasParsedData={hasParsedData}
        match={parsedData.match}
      />

      <ApplicantParsedDataPanels
        education={parsedData.education}
        work={parsedData.work}
        skills={parsedData.skills}
        skillsConfidence={parsedData.skillsConfidence}
      />

      <ApplicantCustomFields
        configured={configuredCustomFields}
        submitted={submittedCustomFields}
      />

      <ApplicantTimeline createdAt={applicant.createdAt} transitions={applicant.transitions} />

      {applicant.email ? (
        <ApplicantEmailComposer
          applicantId={applicant.id}
          applicantName={applicant.name}
          applicantEmail={applicant.email}
          jobTitle={applicant.job.title}
        />
      ) : null}

      <TagsEditor applicantId={applicant.id} tags={applicant.tags} />

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
