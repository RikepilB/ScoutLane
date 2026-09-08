import Link from "next/link";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";
import { LandingTrace } from "./landing/LandingTrace";
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
  const statItems = [
    { value: stats.jobs, label: `open role${stats.jobs === 1 ? "" : "s"}` },
    { value: stats.applicants, label: `applicant${stats.applicants === 1 ? "" : "s"}` },
    { value: stats.templates, label: `template${stats.templates === 1 ? "" : "s"}` },
  ];

  return (
    <div className="[color-scheme:dark] relative min-h-screen overflow-x-hidden bg-ink-900 text-paper">
      {/* Lane-colour atmosphere: royal behind the hero, cyan to the right,
          plum pooling at the bottom. Sits behind everything, never scrolls
          into a visible edge. */}
      <div aria-hidden className="bg-wash-dark pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-5 sm:px-7 sm:pt-6">
        <PublicNav session={session} className="mb-14 sm:mb-20" />

        {/* Hero: one claim, one primary action, the product as evidence. */}
        <section className="mb-28 grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-peri">
              ScoutLane · agent-backed ATS
            </p>
            <h1 className="mb-6 text-balance font-display text-hero font-medium text-paper">
              The ATS that{" "}
              <span className="text-peri">shows its work</span>
            </h1>
            <p className="mb-9 max-w-[520px] text-pretty text-[17px] leading-[28px] text-paper/70">
              ScoutLane turns every resume into structured data, scores it
              against the role, and stages it in a pipeline you can inspect
              step by step.
            </p>
            <div className="mb-12 flex flex-wrap items-center gap-3">
              <Link
                href="/signin"
                className="inline-flex h-11 items-center rounded-control bg-brand-royal px-6 text-sm font-medium text-paper no-underline transition-colors hover:bg-brand-royal-hover"
              >
                Try the demo
              </Link>
              <a
                href="#lane"
                className="inline-flex h-11 items-center rounded-control border border-border-dark-strong px-6 text-sm font-medium text-paper/80 no-underline transition-colors hover:border-sky/40 hover:text-paper"
              >
                See the full lane
              </a>
            </div>
            <dl className="flex max-w-lg flex-wrap gap-x-10 gap-y-3">
              {statItems.map((item) => (
                <div key={item.label} className="flex items-baseline gap-2">
                  <dd className="tabular font-display text-xl font-semibold text-paper">
                    {item.value}
                  </dd>
                  <dt className="text-[13px] text-paper/55">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up animate-fade-up-delay-2">
            <LandingTrace />
          </div>
        </section>

        <LandingHarness />

        <section id="capabilities" className="mb-28">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-sky/80">
            What the harness does
          </p>
          <h2 className="mb-3 text-balance font-display text-display font-medium text-paper">
            Four mechanics, nothing hidden
          </h2>
          <p className="mb-12 max-w-[560px] text-[15px] leading-6 text-paper/65">
            Four mechanics, each with its output stored and readable: not a
            black box with a confidence number.
          </p>
          {/* Editorial grid, not cards: the mechanic names are the structure,
             so the copy breathes instead of sitting in four more boxes. */}
          <dl className="grid gap-x-14 gap-y-10 sm:grid-cols-2">
            {capabilities.map((item, index) => (
              <div key={item.title}>
                <dt className="flex items-baseline gap-3">
                  <span
                    aria-hidden
                    className="tabular font-mono text-[11px] tracking-[0.1em]"
                    style={{ color: index % 2 === 0 ? "var(--color-peri)" : "var(--color-sky)" }}
                  >
                    0{index + 1}
                  </span>
                  <span className="font-medium text-paper">{item.title}</span>
                </dt>
                <dd className="mt-2.5 pl-8 text-sm leading-6 text-paper/65">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <LandingWorkspaceDoors />

        {/* Closing CTA — calls back the hero claim. Open composition: the
            royal glow pools behind the type instead of a box around it. */}
        <section className="relative mb-24 px-6 py-16 text-center sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 56% 68% at 50% 50%, rgba(27,44,193,0.22), transparent 72%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto mb-4 max-w-[560px] text-balance font-display text-display font-medium text-paper">
              Hiring you can inspect, end to end
            </h2>
            <p className="mx-auto mb-8 max-w-[480px] text-pretty text-[15px] leading-6 text-paper/65">
              From the first resume in to the final offer out, every automated
              step leaves a trail you can open. Try it with sample data.
            </p>
            <Link
              href="/signin"
              className="shadow-glow-royal inline-flex h-11 items-center rounded-control bg-brand-royal px-7 text-sm font-medium text-paper no-underline transition-colors hover:bg-brand-royal-hover"
            >
              Try the demo
            </Link>
          </div>
        </section>

        <PublicFooter />
      </div>
    </div>
  );
}
