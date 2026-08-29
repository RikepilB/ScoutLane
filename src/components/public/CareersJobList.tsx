import Link from "next/link";
import type { PublicJob } from "./careers-department-grouping";

interface CareersJobListProps {
  grouped: Map<string, PublicJob[]>;
  totalCount: number;
  count: number;
}

export function CareersJobList({ grouped, totalCount, count }: CareersJobListProps) {
  if (totalCount === 0) {
    return (
      <section className="animate-fade-up animate-fade-up-delay-2 rounded-[24px] p-[60px_20px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        style={{ background: "#f1f5f9", border: "1px dashed #d4d9df", color: "#0c1529" }}>
        <h3 className="mb-2 text-[20px] text-[#0c1529]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          No matching roles right now
        </h3>
        <p className="text-[14px] text-[#394050]">
          Try widening the filters, or set a job alert below &mdash; we&apos;ll ping you when something lands.
        </p>
      </section>
    );
  }

  return (
    <section className="animate-fade-up animate-fade-up-delay-2 rounded-[24px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-sm:p-6"
      style={{ background: "#f1f5f9", color: "#0c1529" }}>
      <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#d4d9df] pb-6 max-sm:flex-col max-sm:items-stretch">
        <div>
          <h2 className="mb-1 text-[32px] tracking-[-0.02em] text-[#0c1529]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Open positions
          </h2>
          <p className="text-[14px] text-[#5f8ea0]">
            {totalCount} of {count} roles match your filters
          </p>
        </div>
        <div className="flex items-center gap-[18px] text-[11px] uppercase tracking-[0.1em] text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
          <span>Sorted &middot; By dept</span>
          <span className="h-1 w-1 rounded-full bg-[#5f8ea0]" />
          <span>Last sync 2m ago</span>
        </div>
      </div>

      <div className="space-y-2">
        {[...grouped.entries()].map(([department, deptJobs], di) => (
          <div key={department}>
            <div className={`flex items-center gap-3.5 border-[#d4d9df] py-3.5 ${di === 0 ? "border-t-0 pt-1" : "border-t"}`}>
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#473459]" style={{ fontFamily: "var(--font-mono)" }}>
                {department}
              </span>
              <span className="rounded-full bg-[rgba(94,167,197,0.10)] px-2 py-0.5 text-[11px] text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
                {deptJobs.length} {deptJobs.length === 1 ? "role" : "roles"}
              </span>
              <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, #d4d9df, transparent)" }} />
            </div>
            {deptJobs.map((job) => (
              <Link
                key={job.id}
                href={`/careers/${job.slug}`}
                className="group grid grid-cols-[1fr_auto_auto_auto] items-center gap-6 rounded-[14px] border border-transparent px-5 py-[18px] text-inherit no-underline transition-all duration-[0.2s] hover:translate-x-1 hover:border-[#d4d9df] hover:bg-white hover:shadow-[0_8px_24px_rgba(9,21,64,0.06)] max-sm:grid-cols-1 max-sm:gap-2"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-[22px] tracking-[-0.01em] text-[#0c1529] transition-colors duration-[0.18s] group-hover:text-[#1B2CC1]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                      {job.title}
                    </span>
                    <span className="text-[12px] text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
                      /{job.slug}
                    </span>
                  </div>
                  <p className="max-w-[580px] text-[13.5px] leading-[1.5] text-[#394050]">
                    {job.department}{job.type ? ` — ${job.type}` : ""}
                  </p>
                </div>
                {job.type && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium ${job.type?.toLowerCase().includes("remote") ? "bg-[rgba(94,167,197,0.15)] text-[#2d6f8a]" : "bg-[rgba(118,146,255,0.14)] text-[#3D518C]"}`}>
                    {job.type}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#394050]" style={{ fontFamily: "var(--font-mono)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5f8ea0" strokeWidth="1.8">
                      <path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12Z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {job.location}
                  </span>
                )}
                {/* Hover arrow */}
                <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#0c1529] text-[#f1f5f9] opacity-0 transition-all duration-[0.2s] group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
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
