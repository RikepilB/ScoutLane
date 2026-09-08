import Link from "next/link";
import { APPLICATION_STATUSES, buildApplicantsHref } from "../_lib/applicant-filters";

interface ApplicantsToolbarProps {
  jobId: string;
  filters: Record<string, string>;
  stages: { id: string; name: string }[];
  sortedStats: { name: string; count: number }[];
  totalApplicants: number;
  canExport?: boolean;
}

export function ApplicantsToolbar({
  jobId,
  filters,
  stages,
  sortedStats,
  totalApplicants,
  canExport,
}: ApplicantsToolbarProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={buildApplicantsHref(jobId, filters, { stageId: undefined })}
            className={`rounded-full px-3 py-1.5 font-medium ${
              !filters.stageId || filters.stageId === "all"
                ? "bg-ink-950 text-white"
                : "bg-paper-2 text-ink-700 hover:bg-mist"
            }`}
          >
            All stages
          </Link>
          {stages.map((s) => {
            const active = filters.stageId === s.id;
            return (
              <Link
                key={s.id}
                href={buildApplicantsHref(jobId, filters, { stageId: s.id })}
                className={`rounded-full px-3 py-1.5 font-medium ${
                  active ? "bg-ink-950 text-white" : "bg-paper-2 text-ink-700 hover:bg-mist"
                }`}
              >
                {s.name}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center text-[11px] font-medium text-muted-foreground">Status:</span>
          <Link
            href={buildApplicantsHref(jobId, filters, { status: undefined })}
            className={`rounded-full px-3 py-1.5 font-medium ${
              !filters.status || filters.status === "all"
                ? "bg-ink-950 text-white"
                : "bg-paper-2 text-ink-700 hover:bg-mist"
            }`}
          >
            All
          </Link>
          {APPLICATION_STATUSES.map((s) => {
            const active = filters.status === s;
            return (
              <Link
                key={s}
                href={buildApplicantsHref(jobId, filters, { status: s })}
                className={`rounded-full px-3 py-1.5 font-medium ${
                  active ? "bg-ink-950 text-white" : "bg-paper-2 text-ink-700 hover:bg-mist"
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Link>
            );
          })}
        </div>
        {canExport && (
          <Link
            href={`/api/admin/jobs/${jobId}/applicants/export`}
            className="rounded-lg border border-border/70 bg-white px-3 py-2 text-xs font-medium text-ink-800 hover:bg-muted/30"
          >
            Export CSV
          </Link>
        )}
      </div>

      {sortedStats.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-paper-2 px-3.5 py-1.5 text-xs font-medium text-ink-700">
            <span className="font-semibold text-ink-950">{totalApplicants}</span> Total
          </div>
          {sortedStats.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-1.5 rounded-full bg-paper-2 px-3.5 py-1.5 text-xs font-medium text-ink-700"
            >
              <span className="font-semibold text-ink-950">{s.count}</span> {s.name}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
