import Link from "next/link";

interface CareersHeroProps {
  count: number;
  session: { user?: { email?: string } } | null;
}

export function CareersHero({ count, session }: CareersHeroProps) {
  return (
    <header className="animate-fade-up relative overflow-hidden rounded-card border border-border-dark bg-ink-950 px-12 pb-11 pt-14">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[600px]">
          <h1 className="mb-5 font-display text-display font-medium text-paper">
            Current job openings at ScoutLane
          </h1>

          <p className="mb-8 max-w-[520px] text-[15px] leading-[24px] text-paper/70">
            ScoutLane helps companies post jobs, parse resumes, and run their hiring pipeline. Explore the roles open today and find one that matches your skills.
          </p>

          <div className="text-[13px] text-paper/55">
            <span className="tabular">{count}</span>{" "}
            {count === 1 ? "position" : "positions"} open right now
          </div>
        </div>

        {/* CTA buttons — signed-out visitors get Sign in as the primary
            action; "Post a job" is a recruiter task and stays secondary. */}
        <div className="flex items-center gap-2.5">
          <Link
            href={session?.user ? "/admin" : "/signin"}
            className="inline-flex h-9 items-center rounded-control bg-brand-royal px-5 text-[13px] font-medium text-paper no-underline transition-colors hover:bg-brand-royal-hover"
          >
            {session?.user ? "Dashboard" : "Sign in"}
          </Link>
          <Link
            href={session?.user ? "/admin/jobs/new" : "/signin"}
            className="inline-flex h-9 items-center gap-1.5 rounded-control border border-border-dark-strong px-5 text-[13px] font-medium text-paper/80 no-underline transition-colors hover:border-sky/40 hover:text-paper"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Post a job
          </Link>
        </div>
      </div>
    </header>
  );
}
