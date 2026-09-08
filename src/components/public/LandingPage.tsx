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
    <div className="relative min-h-screen overflow-x-hidden bg-ink-900 text-paper">
      <div className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-5 sm:px-7 sm:pt-6">
        <PublicNav session={session} className="mb-10 sm:mb-14" />

        <section className="mb-24 grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <h1 className="mb-6 font-display text-hero font-medium text-paper">
              Every resume enters the lane
            </h1>
            <p className="mb-10 max-w-[520px] text-[17px] leading-[28px] text-paper/70">
              An ATS with an agent harness. Resumes are extracted, parsed into
              structured data, scored against the role, staged, and dispatched —
              and every step of that is inspectable.
            </p>
            <div className="mb-12 flex flex-wrap items-center gap-3">
              <Link
                href="/signin?as=admin"
                className="inline-flex h-11 items-center rounded-control bg-brand-royal px-6 text-sm font-medium text-paper no-underline transition-colors hover:bg-brand-royal-hover"
              >
                Admin sign in
              </Link>
              <Link
                href="/signin?as=recruiter"
                className="inline-flex h-11 items-center rounded-control border border-border-dark-strong px-6 text-sm font-medium text-paper/80 no-underline transition-colors hover:border-sky/40 hover:text-paper"
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
                  <dd className="tabular font-display text-xl font-semibold text-paper">
                    {item.value}
                  </dd>
                  <dt className="text-[13px] text-paper/50">{item.label}</dt>
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
          <h2 className="mb-8 font-display text-display font-medium text-paper">
            What the harness actually does
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-card border border-border-dark bg-ink-800 p-6"
              >
                <h3 className="mb-2 font-medium text-sky">{item.title}</h3>
                <p className="text-sm leading-relaxed text-paper/65">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border-dark pt-8 text-center text-xs text-paper/50">
          ScoutLane demo ·{" "}
          <Link href="/jobs" className="text-sky/80 hover:text-sky">
            Job board
          </Link>
          {" · "}
          <Link href="/signin?as=admin" className="text-sky/80 hover:text-sky">
            Admin
          </Link>
          {" · "}
          <Link href="/signin?as=recruiter" className="text-sky/80 hover:text-sky">
            Recruiter
          </Link>
        </footer>
      </div>
    </div>
  );
}
