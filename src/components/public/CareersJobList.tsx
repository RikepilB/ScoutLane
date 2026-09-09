import Link from "next/link";
import type { PublicJob } from "./careers-department-grouping";
import { formatLocations } from "@/lib/jobs/locations";

interface CareersJobListProps {
  grouped: Map<string, PublicJob[]>;
  totalCount: number;
  count: number;
}

export function CareersJobList({ grouped, totalCount, count }: CareersJobListProps) {
  if (totalCount === 0) {
    return (
      <section className="rounded-card border border-dashed border-border bg-surface-secondary p-[60px_20px] text-center text-text-primary">
        <h3 className="mb-2 text-[20px] text-ink-900" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          No matching roles right now
        </h3>
        <p className="text-[14px] text-ink-700">
          Try widening the filters, or set a job alert below &mdash; we&apos;ll ping you when something lands.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-surface-secondary p-10 text-text-primary max-sm:p-6">
      <div className="mb-7 flex items-end justify-between gap-4 border-b border-mist pb-6 max-sm:flex-col max-sm:items-stretch">
        <div>
          <h2 className="mb-1 text-[32px] tracking-[-0.02em] text-ink-900" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Open positions
          </h2>
          <p className="text-[14px] text-steel">
            {totalCount} of {count} roles match your filters
          </p>
        </div>
        <div className="flex items-center gap-[18px] text-[11px] uppercase tracking-[0.1em] text-steel" style={{ fontFamily: "var(--font-mono)" }}>
          <span>Sorted by department</span>
        </div>
      </div>

      <div className="space-y-2">
        {[...grouped.entries()].map(([department, deptJobs], di) => (
          <div key={department}>
            <div className={`flex items-center gap-3.5 border-mist py-3.5 ${di === 0 ? "border-t-0 pt-1" : "border-t"}`}>
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-700">
                {department}
              </span>
              <span className="px-2 py-0.5 text-xs text-text-muted" style={{ fontFamily: "var(--font-mono)" }}>
                {deptJobs.length} {deptJobs.length === 1 ? "role" : "roles"}
              </span>
              <span className="h-px flex-1 bg-mist" />
            </div>
            {deptJobs.map((job) => (
              <Link
                key={job.id}
                href={`/careers/${job.slug}`}
                className="group grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-6 rounded-control border border-transparent px-5 py-[18px] text-inherit transition-colors hover:border-border hover:bg-surface max-sm:grid-cols-1 max-sm:gap-2"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-[22px] tracking-[-0.01em] text-ink-900 transition-colors duration-[0.18s] group-hover:text-brand-royal" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                      {job.title}
                    </span>
                    <span className="text-[12px] text-steel" style={{ fontFamily: "var(--font-mono)" }}>
                      /{job.slug}
                    </span>
                  </div>
                  <p className="max-w-[580px] text-[13.5px] leading-[1.5] text-ink-700">
                    {job.department}{job.type ? ` — ${job.type}` : ""}
                  </p>
                </div>
                {job.type && (
                  <span className="inline-flex items-center text-xs font-medium text-text-secondary">
                    {job.type}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-700" style={{ fontFamily: "var(--font-mono)" }}>
                    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12Z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {formatLocations(job.location)}
                  </span>
                )}
                {/* Hover arrow */}
                <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-paper opacity-0 transition-[opacity,transform] duration-[0.2s] group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M5 12h14" /><path d="m13 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
