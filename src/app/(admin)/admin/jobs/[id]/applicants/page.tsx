import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Search, GraduationCap } from "lucide-react";

interface ApplicantsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}

function extractFromData(data: unknown, field: string): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (field === "institution") {
    const edu = d.education as Array<{ institution?: string }> | undefined;
    return (edu?.map((e) => e.institution).filter(Boolean) as string[]) ?? [];
  }
  if (field === "degree") {
    const edu = d.education as Array<{ field?: string; degree?: string }> | undefined;
    return (edu?.map((e) => e.field ?? e.degree).filter(Boolean) as string[]) ?? [];
  }
  if (field === "skills") {
    return (d.skills as string[]) ?? [];
  }
  return [];
}

function getFirstInstitution(data: unknown): string | null {
  return extractFromData(data, "institution")[0] ?? null;
}

function getFirstDegree(data: unknown): string | null {
  return extractFromData(data, "degree")[0] ?? null;
}

function getSkills(data: unknown): string[] {
  return extractFromData(data, "skills");
}

function matchesSearch(a: { name: string; email: string | null; data: unknown }, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    a.name,
    a.email ?? "",
    JSON.stringify(a.data ?? {}).toLowerCase(),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export default async function ApplicantsListPage({ params, searchParams }: ApplicantsPageProps) {
  const { id } = await params;
  const filters = await searchParams;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) notFound();

  const stages = await prisma.pipelineStage.findMany({
    where: { jobId: id },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  const firstStageId = stages[0]?.id ?? null;

  const where: Record<string, unknown> = { jobId: id };

  if (filters.stageId && filters.stageId !== "all") {
    where.pipelineStageId = filters.stageId;
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

  let orderBy:
    | Record<string, "asc" | "desc">
    | { pipelineStage: { name: "asc" | "desc" } }
    | { createdAt: "asc" | "desc" } = { createdAt: "desc" };

  if (sortField === "name" || sortField === "email" || sortField === "score") {
    orderBy = { [sortField]: sortDir };
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: sortDir };
  } else if (sortField === "pipelineStage") {
    orderBy = { pipelineStage: { name: sortDir } };
  }

  let rawApplicants = await prisma.applicant.findMany({
    where,
    include: { pipelineStage: { select: { id: true, name: true } } },
    orderBy,
  });

  if (filters.search) {
    rawApplicants = rawApplicants.filter((a) => matchesSearch(a, filters.search));
  }

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
    const skillSet = filterSkills.split(",").map((s) => s.trim().toLowerCase());
    applicants = applicants.filter((a) =>
      a.skillsList.some((s) => skillSet.includes(s.toLowerCase())),
    );
  }

  if (sortField === "institution" || sortField === "degree") {
    applicants.sort((a, b) => {
      const av = (sortField === "institution" ? a.institution : a.degree) ?? "";
      const bv = (sortField === "institution" ? b.institution : b.degree) ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const allInstitutions = [
    ...new Set(rawApplicants.map((a) => getFirstInstitution(a.data)).filter((x): x is string => !!x)),
  ].sort();
  const allDegrees = [
    ...new Set(rawApplicants.map((a) => getFirstDegree(a.data)).filter((x): x is string => !!x)),
  ].sort();
  const allSkills = [...new Set(rawApplicants.flatMap((a) => getSkills(a.data)))].sort();

  const groupBy = filters.group;
  if (groupBy === "institution") {
    const grouped: Record<string, typeof applicants> = {};
    for (const a of applicants) {
      const key = a.institution ?? "Unknown";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [
      { ...items[0], isGroup: true, groupKey: key, count: items.length },
      ...items,
    ]);
  } else if (groupBy === "pipelineStage") {
    const grouped: Record<string, typeof applicants> = {};
    for (const a of applicants) {
      const key = a.pipelineStage?.name ?? "Unassigned";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [
      { ...items[0], isGroup: true, groupKey: key, count: items.length },
      ...items,
    ]);
  } else if (groupBy === "degree") {
    const grouped: Record<string, typeof applicants> = {};
    for (const a of applicants) {
      const key = a.degree ?? "Unknown";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [
      { ...items[0], isGroup: true, groupKey: key, count: items.length },
      ...items,
    ]);
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function buildHref(updates: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const current = { ...filters, ...updates };
    Object.entries(current).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v);
    });
    const qs = params.toString();
    return `/admin/jobs/${id}/applicants${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={buildHref({ stageId: undefined })}
            className={`rounded-full px-3 py-1.5 font-medium ${
              !filters.stageId || filters.stageId === "all"
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All stages
          </Link>
          {stages.map((s) => {
            const active = filters.stageId === s.id;
            return (
              <Link
                key={s.id}
                href={buildHref({ stageId: s.id })}
                className={`rounded-full px-3 py-1.5 font-medium ${
                  active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {s.name}
              </Link>
            );
          })}
        </div>
        <Link
          href={`/api/admin/jobs/${id}/applicants/export`}
          className="rounded-lg border border-border/70 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-muted/30"
        >
          Export CSV
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={filters.search || ""}
            placeholder="Search name, email, skills, parsed resume…"
            className="w-full rounded-xl border border-border/70 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
          />
        </div>
        {allInstitutions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">Institution</label>
            <select
              name="institution"
              defaultValue={filters.institution ?? ""}
              className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
            >
              <option value="">Any</option>
              {allInstitutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
        )}
        {allDegrees.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">Field / degree</label>
            <select
              name="degree"
              defaultValue={filters.degree ?? ""}
              className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
            >
              <option value="">Any</option>
              {allDegrees.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Applied from</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={filters.dateFrom ?? ""}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Applied to</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={filters.dateTo ?? ""}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Skills contains</label>
          <input
            name="skills"
            defaultValue={filters.skills ?? ""}
            placeholder="comma separated"
            className="min-w-[160px] rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Sort</label>
          <select
            name="sort"
            defaultValue={filters.sort ?? "createdAt-desc"}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value="createdAt-desc">Applied (newest)</option>
            <option value="createdAt-asc">Applied (oldest)</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="institution-asc">Institution A–Z</option>
            <option value="institution-desc">Institution Z–A</option>
            <option value="degree-asc">Degree A–Z</option>
            <option value="degree-desc">Degree Z–A</option>
            <option value="pipelineStage-asc">Stage A–Z</option>
            <option value="pipelineStage-desc">Stage Z–A</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Group</label>
          <select
            name="group"
            defaultValue={filters.group ?? ""}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value="">None</option>
            <option value="institution">Institution</option>
            <option value="degree">Degree / field</option>
            <option value="pipelineStage">Pipeline stage</option>
          </select>
        </div>
        {filters.stageId && filters.stageId !== "all" ? (
          <input type="hidden" name="stageId" value={filters.stageId} />
        ) : null}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          Apply filters
        </button>
      </form>

      {applicants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No applicants found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Institution</th>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {applicants.map((a: any) => {
                if (a.isGroup) {
                  return (
                    <tr key={a.groupKey} className="bg-muted/30">
                      <td colSpan={6} className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                        <GraduationCap className="mr-1.5 inline h-3.5 w-3.5" />
                        {a.groupKey} — {a.count} applicant{a.count !== 1 ? "s" : ""}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={a.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/jobs/${id}/applicants/${a.id}`}
                        className="font-medium text-slate-950 hover:underline"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.institution ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="truncate">{a.degree ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {a.pipelineStage?.name ?? (firstStageId ? "Unassigned" : "—")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {a.score ? (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          {a.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(a.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
