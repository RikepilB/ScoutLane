import Link from "next/link";

interface CareersHeroProps {
  count: number;
  session: { user?: { email?: string } } | null;
}

export function CareersHero({ count, session }: CareersHeroProps) {
  return (
    <header className="animate-fade-up relative overflow-hidden rounded-[24px] border border-[#1a2870] px-12 pb-11 pt-14"
      style={{
        background: "radial-gradient(circle at 8% 10%, rgba(27,44,193,0.55), transparent 55%), linear-gradient(170deg, #091540 0%, #0c1529 70%)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>
      {/* Grid mask overlay */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(118,146,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(118,146,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          backgroundPosition: "-1px -1px",
          WebkitMaskImage: "radial-gradient(ellipse at 70% 50%, black 30%, transparent 75%)",
          maskImage: "radial-gradient(ellipse at 70% 50%, black 30%, transparent 75%)",
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[600px]">
          {/* Eyebrow pill — brand-hero style */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[rgba(171,210,250,0.25)] bg-[rgba(171,210,250,0.08)] py-1.5 pl-2 pr-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABD2FA]"
            style={{ fontFamily: "var(--font-mono)" }}>
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[#ABD2FA]" />
            AI-powered recruitment
          </div>

          {/* Title */}
          <h1 className="mb-5 text-[clamp(36px,5vw,46px)] font-medium leading-[1] tracking-[-0.03em] text-[#f1f5f9]"
            style={{ fontFamily: "var(--font-display)" }}>
            Current job openings<br />at ScoutLane
          </h1>

          {/* Subtitle */}
          <p className="mb-8 max-w-[520px] text-[15px] leading-[22px] text-[#f1f5f9]/70">
            ScoutLane helps companies post jobs, parse resumes, and run their hiring pipeline. Explore the roles open today and find one that matches your skills.
          </p>

          {/* Meta line */}
          <div className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.1em] text-[#f1f5f9]/55"
            style={{ fontFamily: "var(--font-mono)" }}>
            <span className="inline-block h-px w-6 bg-[#5ea7c5]" />
            Open positions · {count} {count === 1 ? "job" : "jobs"} available
          </div>
        </div>

        {/* CTA Buttons — horizontal row */}
        <div className="flex items-center gap-2.5">
          {session?.user ? (
            <Link
              href="/admin"
              className="inline-flex h-[31px] items-center rounded-full border border-white/[0.16] bg-white/[0.06] px-6 text-[12.8px] font-medium text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:bg-white/[0.12]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex h-[31px] items-center rounded-full border border-white/[0.16] bg-white/[0.06] px-6 text-[12.8px] font-medium text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:bg-white/[0.12]"
            >
              Sign in
            </Link>
          )}
          {session?.user ? (
            <Link
              href="/admin/jobs/new"
              className="inline-flex h-[31px] items-center gap-1.5 rounded-full px-6 text-[12.4px] font-semibold text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
                boxShadow: "0 8px 20px rgba(27,44,193,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Post a job
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex h-[31px] items-center gap-1.5 rounded-full px-6 text-[12.4px] font-semibold text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
                boxShadow: "0 8px 20px rgba(27,44,193,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Post a job
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
