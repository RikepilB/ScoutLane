import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Search, GraduationCap, Wrench } from "lucide-react";
import { ApplicantStatusBadge } from "@/components/admin/ApplicantStatusBadge";
import { ApplicationStatus } from "@/generated/prisma/enums";

interface ApplicantsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}

function extractFromData(data: unknown, field: string): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (field === "institution") {
    const edu = d.education as Array<{ institution?: string }> | undefined;
    return edu?.map((e) => e.institution).filter(Boolean) as string[] ?? [];
  }
  if (field === "skills") {
    return (d.skills as string[]) ?? [];
  }
  return [];
}

function getFirstInstitution(data: unknown): string | null {
  const inst = extractFromData(data, "institution");
  return inst[0] ?? null;
}

function getSkills(data: unknown): string[] {
  return extractFromData(data, "skills");
}

export default async function ApplicantsListPage({ params, searchParams }: ApplicantsPageProps) {
  const { id } = await params;
  const filters = await searchParams;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) notFound();

  const where: any = { jobId: id };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const validStatuses = Object.values(ApplicationStatus) as string[];
  if (filters.status && filters.status !== "all" && validStatuses.includes(filters.status)) {
    where.status = filters.status;
  }

  const allowedSortFields = ["createdAt", "name", "email", "score", "status"];
  const allowedSortDirs = ["asc", "desc"];
  const [sortField, sortDir] = (filters.sort || "createdAt-desc").split("-");
  const safeField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
  const safeDir = allowedSortDirs.includes(sortDir) ? sortDir : "desc";
  const orderBy: any = {};
  orderBy[safeField] = safeDir;

  const rawApplicants = await prisma.applicant.findMany({
    where,
    orderBy,
  });

  let applicants = rawApplicants.map((a) => ({
    ...a,
    institution: getFirstInstitution(a.data),
    skillsList: getSkills(a.data),
  }));

  const filterInstitution = filters.institution;
  if (filterInstitution) {
    applicants = applicants.filter((a) => a.institution?.toLowerCase().includes(filterInstitution.toLowerCase()));
  }

  const filterSkills = filters.skills;
  if (filterSkills) {
    const skillSet = filterSkills.split(",").map((s) => s.trim().toLowerCase());
    applicants = applicants.filter((a) =>
      a.skillsList.some((s) => skillSet.includes(s.toLowerCase())),
    );
  }

  const allInstitutions: string[] = [...new Set(rawApplicants.map((a) => getFirstInstitution(a.data)).filter((x): x is string => !!x))].sort();
  const allSkills = [...new Set(rawApplicants.flatMap((a) => getSkills(a.data)))].sort();

  const groupBy = filters.group;
  if (groupBy === "institution") {
    const grouped: Record<string, typeof applicants> = {};
    for (const a of applicants) {
      const key = a.institution ?? "Unknown";
      (grouped[key] ??= []).push(a);
    }
    applicants = Object.entries(grouped).flatMap(([key, items]) => [{ ...items[0], isGroup: true, groupKey: key, count: items.length }, ...items]);
  }

  const statuses = ["all", "NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"];

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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form>
            <input
              type="text"
              name="search"
              defaultValue={filters.search || ""}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-border/70 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
            />
          </form>
        </div>

        {allInstitutions.length > 0 && (
          <select
            value={filters.institution ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              window.location.href = buildHref({ institution: v || undefined });
            }}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value="">All institutions</option>
            {allInstitutions.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        )}

        <select
          value={filters.group ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            window.location.href = buildHref({ group: v || undefined });
          }}
          className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        >
          <option value="">No grouping</option>
          <option value="institution">By institution</option>
          <option value="status">By status</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const href = buildHref({ status: s === "all" ? undefined : s });
          const active = s === "all" ? !filters.status : filters.status === s;
          return (
            <Link
              key={s}
              href={href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

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
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {applicants.map((a: any) => {
                if (a.isGroup) {
                  return (
                    <tr key={a.groupKey} className="bg-muted/30">
                      <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-muted-foreground">
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
                    <td className="px-5 py-4">
                      <ApplicantStatusBadge status={a.status} />
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
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(a.createdAt)}
                    </td>
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
