import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { isApplicationStatus, getFirstInstitution, getFirstDegree, getSkills } from "./_lib/applicant-filters";
import { ApplicantsToolbar } from "./_components/ApplicantsToolbar";
import { ApplicantsFilterForm } from "./_components/ApplicantsFilterForm";
import { ApplicantsTable } from "./_components/ApplicantsTable";

interface ApplicantsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function ApplicantsListPage({ params, searchParams }: ApplicantsPageProps) {
  const { id } = await params;
  const filters = await searchParams;
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;
  if (!organizationId) notFound();

  const page = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(filters.pageSize ?? "20", 10) || 20));

  const job = await prisma.job.findFirst({ where: { id, organizationId } });
  if (!job) notFound();

  const stages = await prisma.pipelineStage.findMany({
    where: { jobId: id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  const firstStageId = stages[0]?.id ?? null;

  const where: Prisma.ApplicantWhereInput = { jobId: id, job: { organizationId } };

  if (filters.stageId && filters.stageId !== "all") {
    where.pipelineStageId = filters.stageId;
  }

  if (filters.status && filters.status !== "all" && isApplicationStatus(filters.status)) {
    where.status = filters.status;
  }

  if (filters.search?.trim()) {
    where.OR = [
      { name: { contains: filters.search.trim(), mode: "insensitive" } },
      { email: { contains: filters.search.trim(), mode: "insensitive" } },
    ];
  }

  if (filters.scoreMin || filters.scoreMax) {
    const scoreFilter: { gte?: number; lte?: number } = {};
    const min = parseFloat(filters.scoreMin ?? "");
    const max = parseFloat(filters.scoreMax ?? "");
    if (!Number.isNaN(min)) scoreFilter.gte = min;
    if (!Number.isNaN(max)) scoreFilter.lte = max;
    if (Object.keys(scoreFilter).length > 0) {
      where.score = scoreFilter;
    }
  }

  const createdFilter: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (!Number.isNaN(from.getTime())) createdFilter.gte = from;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      createdFilter.lte = to;
    }
  }
  if (Object.keys(createdFilter).length > 0) {
    where.createdAt = createdFilter;
  }

  const sortParam = filters.sort || "createdAt-desc";
  const [sortField, sortDirRaw] = sortParam.split("-");
  const sortDir = sortDirRaw === "asc" ? "asc" : "desc";

  let orderBy: Prisma.ApplicantOrderByWithRelationInput = { createdAt: "desc" };

  if (sortField === "name" || sortField === "email" || sortField === "score") {
    orderBy = { [sortField]: sortDir } as Prisma.ApplicantOrderByWithRelationInput;
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: sortDir };
  } else if (sortField === "interviewDate") {
    orderBy = { interviewDate: sortDir };
  } else if (sortField === "pipelineStage") {
    orderBy = { pipelineStage: { name: sortDir } };
  }

  type ApplicantListRow = Prisma.ApplicantGetPayload<{
    include: { pipelineStage: { select: { id: true; name: true } } };
  }>;

  let rawApplicants: ApplicantListRow[] = await prisma.applicant.findMany({
    where,
    include: { pipelineStage: { select: { id: true, name: true } } },
    orderBy,
  });

  let applicants = rawApplicants.map((a) => ({
    ...a,
    institution: getFirstInstitution(a.data),
    degree: getFirstDegree(a.data),
    skillsList: getSkills(a.data),
  }));

  if (filters.institution) {
    applicants = applicants.filter((a) =>
      a.institution?.toLowerCase().includes(filters.institution.toLowerCase()),
    );
  }
  if (filters.degree) {
    applicants = applicants.filter((a) =>
      a.degree?.toLowerCase().includes(filters.degree.toLowerCase()),
    );
  }

  const filterSkills = filters.skills;
  if (filterSkills) {
    const skillSet = filterSkills.split(",").map((s: string) => s.trim().toLowerCase());
    applicants = applicants.filter((a) =>
      a.skillsList.some((s: string) => skillSet.includes(s.toLowerCase())),
    );
  }

  if (sortField === "institution" || sortField === "degree") {
    applicants.sort((a, b) => {
      const av = (sortField === "institution" ? a.institution : a.degree) ?? "";
      const bv = (sortField === "institution" ? b.institution : b.degree) ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const allInstitutions: string[] = [
    ...new Set(rawApplicants.map((a: ApplicantListRow) => getFirstInstitution(a.data)).filter((x): x is string => !!x)),
  ].sort();
  const allDegrees: string[] = [
    ...new Set(rawApplicants.map((a: ApplicantListRow) => getFirstDegree(a.data)).filter((x): x is string => !!x)),
  ].sort();
  const allSkills: string[] = [...new Set(rawApplicants.flatMap((a: ApplicantListRow) => getSkills(a.data)))].sort();

  const totalApplicants = applicants.length;
  const totalPages = Math.ceil(totalApplicants / pageSize);
  const paginatedApplicants = applicants.slice((page - 1) * pageSize, page * pageSize);

  const groupBy = filters.group;
  if (groupBy === "institution") {
    const grouped: Record<string, typeof paginatedApplicants> = {};
    for (const a of paginatedApplicants) {
      const key = a.institution ?? "Unknown";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [
      { ...items[0], isGroup: true, groupKey: key, count: items.length },
      ...items,
    ]);
  } else if (groupBy === "pipelineStage") {
    const grouped: Record<string, typeof paginatedApplicants> = {};
    for (const a of paginatedApplicants) {
      const key = a.pipelineStage?.name ?? "Unassigned";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [
      { ...items[0], isGroup: true, groupKey: key, count: items.length },
      ...items,
    ]);
  } else if (groupBy === "degree") {
    const grouped: Record<string, typeof paginatedApplicants> = {};
    for (const a of paginatedApplicants) {
      const key = a.degree ?? "Unknown";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [
      { ...items[0], isGroup: true, groupKey: key, count: items.length },
      ...items,
    ]);
  } else {
    applicants = paginatedApplicants;
  }

  const stageStats = new Map<string, number>();
  for (const a of rawApplicants) {
    const name = a.pipelineStage?.name ?? "Unassigned";
    stageStats.set(name, (stageStats.get(name) ?? 0) + 1);
  }
  const sortedStats = Array.from(stageStats.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <ApplicantsToolbar
        jobId={id}
        filters={filters}
        stages={stages}
        sortedStats={sortedStats}
        totalApplicants={totalApplicants}
      />

      <ApplicantsFilterForm
        filters={filters}
        allInstitutions={allInstitutions}
        allDegrees={allDegrees}
        allSkills={allSkills}
      />

      <ApplicantsTable
        applicants={applicants}
        jobId={id}
        firstStageId={firstStageId}
        filters={filters}
        page={page}
        pageSize={pageSize}
        totalApplicants={totalApplicants}
        totalPages={totalPages}
      />
    </div>
  );
}
