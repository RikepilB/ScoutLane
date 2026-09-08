const stations = [
  { id: "apply", label: "Apply", detail: "Resume + form" },
  { id: "extract", label: "Extract", detail: "PDF / DOCX text" },
  { id: "parse", label: "Parse", detail: "LLM structured JSON" },
  { id: "score", label: "Score", detail: "Job-fit 0–1" },
  { id: "stage", label: "Stage", detail: "Kanban column" },
  { id: "dispatch", label: "Dispatch", detail: "Webhook / agent" },
];

/**
 * The lane is drawn as an open flow, not a box of boxes: the six stations
 * sit directly on the page, each hanging from a short gradient tick, with
 * the animated sweep running along the top edge of the group. The enclosing
 * card from the previous revision is gone — the section heading plus the
 * connecting rhythm carry the structure.
 */
export function LandingHarness() {
  return (
    <section id="lane" className="mb-24 scroll-mt-6">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-peri">
          The lane
        </p>
        <h2 className="font-display text-display font-medium text-paper">
          After apply, the lane runs itself
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-paper/65">
          Extraction, parsing, scoring, staging, then outbound events. Recruiters move
          people. Agents handle the rest.
        </p>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="animate-harness-trace mb-3 hidden h-px md:block"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(118,146,255,0.35), #ABD2FA, rgba(118,146,255,0.35), transparent)",
          }}
        />

        <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {stations.map((station, index) => (
            <li
              key={station.id}
              className="animate-harness-station rounded-2xl p-4"
              style={{ animationDelay: `${index * 1.2}s` }}
            >
              <span
                aria-hidden
                className="mb-3 block h-px w-8"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(118,146,255,0.7), transparent)",
                }}
              />
              <span className="tabular font-mono text-[10px] uppercase tracking-[0.14em] text-peri/90">
                0{index + 1}
              </span>
              <strong className="mt-2 block text-[15px] font-medium text-paper">
                {station.label}
              </strong>
              <span className="mt-1 block text-xs text-paper/55">{station.detail}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 font-mono text-xs leading-5 text-steel">
          apply → extractText → OpenRouter parse → matchScore → PipelineStage → HMAC webhook
        </p>
      </div>
    </section>
  );
}
