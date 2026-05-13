import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Search } from "lucide-react";
import { ApplicantStatusBadge } from "@/components/admin/ApplicantStatusBadge";
import { ApplicationStatus } from "@/generated/prisma/enums";

interface ApplicantsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ search?: string; status?: string; sort?: string }>;
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

  const applicants = await prisma.applicant.findMany({
    where,
    orderBy,
  });

  const statuses = ["all", "NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"];

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
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
              placeholder="Search applicants..."
              className="w-full rounded-xl border border-border/70 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
            />
          </form>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {statuses.map((s) => {
            const href = s === "all"
              ? `/admin/jobs/${id}/applicants${filters.search ? `?search=${filters.search}` : ""}`
              : `/admin/jobs/${id}/applicants?status=${s}${filters.search ? `&search=${filters.search}` : ""}`;
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
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {applicants.map((a) => (
                <tr key={a.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/jobs/${id}/applicants/${a.id}`}
                      className="font-medium text-slate-950 hover:underline"
                    >
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{a.email ?? "—"}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
