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
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: "-240px",
          left: "-120px",
          width: "780px",
          height: "780px",
          background: "radial-gradient(circle, rgba(27,44,193,0.42), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none fixed z-0"
        style={{
          top: "40%",
          right: "-180px",
          width: "640px",
          height: "640px",
          background: "radial-gradient(circle, rgba(94,167,197,0.2), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1240px] px-5 pb-20 pt-5 sm:px-7 sm:pt-6">
        <PublicNav session={session} className="mb-10 sm:mb-14" />

        <section className="mb-20 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <div
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[rgba(171,210,250,0.25)] bg-[rgba(171,210,250,0.08)] py-1.5 pl-2 pr-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABD2FA]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[#ABD2FA]" />
              Hiring operations, agent-backed
            </div>
            <h1
              className="mb-6 text-[clamp(40px,6.4vw,62px)] font-medium leading-[0.98] tracking-[-0.04em] text-[#f1f5f9]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every resume
              <br />
              enters the <span className="text-[#ABD2FA]">lane</span>
            </h1>
            <p className="mb-8 max-w-[540px] text-[16px] leading-[26px] text-[#f1f5f9]/70">
              ScoutLane is an ATS with an agent harness: extract, parse, score, stage, then
              dispatch. Two demo workspaces — Admin and Recruiter — already hold sample jobs
              and applicants.
            </p>
            <div className="mb-10 flex flex-wrap gap-3">
              <Link
                href="/signin?as=admin"
                className="inline-flex h-11 items-center rounded-full px-7 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
                  boxShadow: "0 8px 20px rgba(27,44,193,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
                }}
              >
                Admin sign in
              </Link>
              <Link
                href="/signin?as=recruiter"
                className="inline-flex h-11 items-center rounded-full border border-[#5ea7c5]/40 bg-white/[0.04] px-7 text-sm font-medium text-white no-underline transition hover:bg-white/[0.08]"
              >
                Recruiter sign in
              </Link>
              <Link
                href="/jobs"
                className="inline-flex h-11 items-center px-2 text-sm font-medium text-[#ABD2FA] no-underline hover:text-white"
              >
                Browse job board →
              </Link>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: "Open jobs", value: stats.jobs },
                { label: "Applicants", value: stats.applicants },
                { label: "Templates", value: stats.templates },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 sm:px-4"
                >
                  <dt className="text-[10px] uppercase tracking-wider text-[#f1f5f9]/50">
                    {item.label}
                  </dt>
                  <dd
                    className="mt-1 text-2xl font-semibold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.value}
                  </dd>
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
