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

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function LandingPage({ stats, session }: LandingPageProps) {
  const statItems = [
    { label: plural(stats.jobs, "open role"), value: stats.jobs },
    { label: plural(stats.applicants, "applicant"), value: stats.applicants },
    { label: plural(stats.templates, "template"), value: stats.templates },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-900 text-paper">
      <div className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-5 sm:px-7 sm:pt-6">
        <PublicNav session={session} className="mb-14 sm:mb-20" />

        {/* Hero: one claim, one primary action, the product as evidence. */}
        <section className="mb-24 grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <h1 className="mb-6 font-display text-hero font-medium text-paper">
              The ATS that shows its work
            </h1>
            <p className="mb-9 max-w-[520px] text-[17px] leading-[28px] text-paper/70">
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
                  <dt className="text-[13px] text-paper/50">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up animate-fade-up-delay-2">
            <LandingTrace />
          </div>
        </section>

        <LandingHarness />

        <section id="capabilities" className="mb-24">
          <h2 className="mb-3 font-display text-display font-medium text-paper">
            What the harness actually does
          </h2>
          <p className="mb-8 max-w-[560px] text-[15px] leading-6 text-paper/65">
            Four mechanics, each with its output stored and readable — not a
            black box with a confidence number.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-card border border-border-dark bg-ink-800 p-6"
              >
                <h3 className="mb-2 font-medium text-paper">{item.title}</h3>
                <p className="text-sm leading-relaxed text-paper/65">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <LandingWorkspaceDoors />

        {/* Closing CTA — calls back the hero claim. */}
        <section className="mb-24 rounded-card border border-border-dark bg-ink-950 px-8 py-14 text-center sm:px-12">
          <h2 className="mx-auto mb-4 max-w-[560px] font-display text-display font-medium text-paper">
            Hiring you can inspect, end to end
          </h2>
          <p className="mx-auto mb-8 max-w-[480px] text-[15px] leading-6 text-paper/65">
            From the first resume in to the final offer out, every automated
            step leaves a trail you can open. Try it with sample data.
          </p>
          <Link
            href="/signin"
            className="inline-flex h-11 items-center rounded-control bg-brand-royal px-7 text-sm font-medium text-paper no-underline transition-colors hover:bg-brand-royal-hover"
          >
            Try the demo
          </Link>
        </section>

        <PublicFooter />
      </div>
    </div>
  );
}
