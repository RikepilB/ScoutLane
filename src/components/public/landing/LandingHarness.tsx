const stations = [
  { id: "apply", label: "Apply", detail: "Resume + form" },
  { id: "extract", label: "Extract", detail: "PDF / DOCX text" },
  { id: "parse", label: "Parse", detail: "LLM structured JSON" },
  { id: "score", label: "Score", detail: "Job-fit 0–1" },
  { id: "stage", label: "Stage", detail: "Kanban column" },
  { id: "dispatch", label: "Dispatch", detail: "Webhook / agent" },
];

export function LandingHarness() {
  return (
    <section className="mb-20">
      <div className="mb-8 max-w-2xl">
        <p
          className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#ABD2FA]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Agentic harness
        </p>
        <h2
          className="text-[clamp(26px,4vw,36px)] font-medium leading-[1.1] tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          After apply, the lane runs itself
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[#f1f5f9]/65">
          Extraction, parsing, scoring, staging, then outbound events. Recruiters move
          people. Agents handle the rest.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-[24px] border border-[#1a2870] p-5 sm:p-8"
        style={{
          background:
            "linear-gradient(170deg, rgba(9,21,64,0.92) 0%, rgba(12,21,41,0.96) 100%)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="animate-harness-trace mb-6 hidden h-px md:block"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(171,210,250,0.15), #7692FF, rgba(171,210,250,0.15), transparent)",
          }}
        />

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {stations.map((station, index) => (
            <li
              key={station.id}
              className="animate-harness-station rounded-2xl border border-[#ABD2FA]/15 px-4 py-4"
              style={{ animationDelay: `${index * 1.2}s` }}
            >
              <span
                className="block text-[10px] uppercase tracking-[0.14em] text-[#5f8ea0]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                0{index + 1}
              </span>
              <strong className="mt-2 block text-[15px] font-medium text-white">{station.label}</strong>
              <span className="mt-1 block text-xs text-[#f1f5f9]/55">{station.detail}</span>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-xs leading-5 text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
          apply → extractText → OpenRouter parse → matchScore → PipelineStage → HMAC webhook
        </p>
      </div>
    </section>
  );
}
