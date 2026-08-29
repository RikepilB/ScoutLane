import Link from "next/link";
import { PublicNav } from "./PublicNav";
import { LandingCommandPreview } from "./landing/LandingCommandPreview";
import { LandingHarness } from "./landing/LandingHarness";
import { LandingWorkspaceDoors } from "./landing/LandingWorkspaceDoors";

interface LandingPageProps {
  stats: {
    jobs: number;
    applicants: number;
    templates: number;
  };
  session: { user?: { email?: string } } | null;
}

const capabilities = [
  {
    title: "Structured resume parse",
    body: "PDF, DOCX, TXT extracted, then an LLM writes education, work history, and skills into JSON you can edit.",
  },
  {
    title: "Job-fit score",
    body: "Each applicant is scored against the role. Recruiters sort and shortlist from a number, not a pile of PDFs.",
  },
  {
    title: "Kanban with memory",
    body: "Drag a card, status updates, a stage log is written, and configured webhooks fire with HMAC signing.",
  },
  {
    title: "Templates that snapshot",
    body: "Forms, stages, and screening questions copy onto the job. Later template edits never mutate live roles.",
  },
];

export function LandingPage({ stats, session }: LandingPageProps) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#0c1529", color: "#f1f5f9", fontFamily: "var(--font-body)" }}
    >
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: "-280px",
          left: "-160px",
          width: "820px",
          height: "820px",
          background: "radial-gradient(circle, rgba(27,44,193,0.22), transparent 72%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1240px] px-5 pb-20 pt-5 sm:px-7 sm:pt-6">
        <PublicNav session={session} className="mb-10 sm:mb-14" />

        <section className="mb-24 grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <p
              className="mb-7 text-[11px] font-medium uppercase tracking-[0.2em] text-[#ABD2FA]/70"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Hiring operations, agent-backed
            </p>
            <h1
              className="mb-7 text-[clamp(42px,6.4vw,66px)] font-medium leading-[0.98] tracking-[-0.04em] text-[#f1f5f9]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every resume
              <br />
              enters the <span className="text-[#ABD2FA]">lane</span>
            </h1>
            <p className="mb-10 max-w-[480px] text-[16px] leading-[27px] text-[#f1f5f9]/60">
              An ATS with an agent harness: extract, parse, score, stage, then dispatch.
            </p>
            <div className="mb-12 flex flex-wrap items-center gap-4">
              <Link
                href="/signin?as=admin"
                className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/[0.04] px-7 text-sm font-medium text-white no-underline transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                Admin sign in
              </Link>
              <Link
                href="/signin?as=recruiter"
                className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/[0.04] px-7 text-sm font-medium text-white no-underline transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                Recruiter sign in
              </Link>
            </div>
            <dl className="flex max-w-lg flex-wrap gap-x-8 gap-y-3">
              {[
                { label: "Open jobs", value: stats.jobs },
                { label: "Applicants", value: stats.applicants },
                { label: "Templates", value: stats.templates },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline gap-2">
                  <dd
                    className="text-xl font-semibold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.value}
                  </dd>
                  <dt className="text-[11px] uppercase tracking-wider text-[#f1f5f9]/40">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up animate-fade-up-delay-2">
            <LandingCommandPreview />
          </div>
        </section>

        <LandingWorkspaceDoors />
        <LandingHarness />

        <section className="mb-16">
          <h2
            className="mb-8 text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.03em] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What the harness actually does
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.14]"
              >
                <h3 className="mb-2 font-medium text-[#ABD2FA]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[#f1f5f9]/65">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/[0.08] pt-8 text-center text-xs text-slate-500">
          ScoutLane demo ·{" "}
          <Link href="/jobs" className="text-sky-400 hover:text-sky-300">
            Job board
          </Link>
          {" · "}
          <Link href="/signin?as=admin" className="text-sky-400 hover:text-sky-300">
            Admin
          </Link>
          {" · "}
          <Link href="/signin?as=recruiter" className="text-sky-400 hover:text-sky-300">
            Recruiter
          </Link>
        </footer>
      </div>
    </div>
  );
}
