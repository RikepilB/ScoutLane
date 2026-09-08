/**
 * The hero's product evidence: one applicant rendered as an inspectable run.
 * Lever-style annotated mock — including the product saying no to a candidate
 * WITH the reasons visible. Showing a rejection with its rationale is the
 * whole "every step inspectable" claim made literal; a mock that only shows
 * wins proves nothing.
 */
const parsed = [
  { key: "Experience", value: "Staff Engineer · 7 years" },
  { key: "Education", value: "M.S. Computer Science · CMU" },
  { key: "Skills", value: "TypeScript, Prisma, Next.js" },
];

const traceSteps = [
  { t: "00:00", text: "resume.pdf received · 412 KB" },
  { t: "00:01", text: "text extracted · 2 pages, clean copy" },
  { t: "00:03", text: "parsed 14 fields into structured JSON" },
  { t: "00:04", text: "scored 0.91 · matched 6 of 8 role criteria" },
  { t: "00:04", text: "staged to Interview · note written to timeline" },
];

export function LandingTrace() {
  return (
    <div
      className="shadow-lift-dark relative overflow-hidden rounded-card border border-border-dark"
      style={{
        background:
          "linear-gradient(165deg, rgba(27,44,193,0.14) 0%, rgba(9,21,64,0.92) 34%, rgba(9,21,64,0.96) 100%)",
      }}
    >
      {/* Top rim: a light-catching hairline so the card reads as lifted,
          not outlined. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 8%, rgba(171,210,250,0.45) 50%, transparent 92%)",
        }}
      />
      <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-paper/60">Senior Frontend Engineer · applicant</p>
          <p className="mt-1 text-lg font-medium text-paper">Priya Shah</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="tabular font-display text-3xl font-semibold text-paper">0.91</span>
          <span className="text-[12px] text-paper/50">job-fit score</span>
        </div>
      </div>

      <div className="mb-6 grid gap-3 border-y border-border-dark py-5 sm:grid-cols-3">
        {parsed.map((row) => (
          <div key={row.key}>
            <p className="text-[11px] uppercase tracking-[0.08em] text-paper/45">{row.key}</p>
            <p className="mt-1 text-[13px] leading-5 text-paper/85">{row.value}</p>
          </div>
        ))}
      </div>

      <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-paper/45">
        Decision log
      </p>
      <ol className="space-y-2">
        {traceSteps.map((step) => (
          <li key={step.text} className="flex gap-3 text-[12.5px] leading-5">
            <span className="tabular font-mono text-steel">{step.t}</span>
            <span className="text-paper/75">{step.text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-control border border-warning/25 bg-warning-soft p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[13px] font-medium text-paper">Marcus Webb · 0.34</span>
          <span className="text-[12px] text-warning">not advanced</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-5 text-paper/70">
          2 yrs frontend (role asks 5+), no TypeScript, no platform work. A decline
          email is drafted for recruiter review — nothing sends itself.
        </p>
      </div>
      </div>
    </div>
  );
}
