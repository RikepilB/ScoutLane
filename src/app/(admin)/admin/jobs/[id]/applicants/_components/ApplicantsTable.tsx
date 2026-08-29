import Link from "next/link";
import { GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { buildApplicantsHref, formatDate } from "../_lib/applicant-filters";

interface ApplicantsTableProps {
  applicants: any[];
  jobId: string;
  firstStageId: string | null;
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  totalApplicants: number;
  totalPages: number;
}

export function ApplicantsTable({
  applicants,
  jobId,
  firstStageId,
  filters,
  page,
  pageSize,
  totalApplicants,
  totalPages,
}: ApplicantsTableProps) {
  return (
    <>
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
                        href={`/admin/jobs/${jobId}/applicants/${a.id}`}
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

      {totalApplicants > 0 && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalApplicants)} of {totalApplicants} applicants
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildApplicantsHref(jobId, filters, { page: String(page - 1), pageSize: String(pageSize) })}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/30 px-3 py-1.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </span>
            )}
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildApplicantsHref(jobId, filters, { page: String(page + 1), pageSize: String(pageSize) })}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/30 px-3 py-1.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
