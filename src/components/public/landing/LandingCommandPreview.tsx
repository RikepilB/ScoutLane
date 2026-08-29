const columns = [
  {
    name: "New",
    cards: [
      { name: "Priya Shah", score: "0.91", skill: "TypeScript" },
      { name: "Jonah Hale", score: "0.74", skill: "React" },
    ],
  },
  {
    name: "Reviewing",
    cards: [{ name: "Elena Voss", score: "0.88", skill: "Product" }],
  },
  {
    name: "Interview",
    cards: [{ name: "Marcus Chen", score: "0.83", skill: "Systems" }],
  },
];

const parsed = [
  { key: "education", value: "M.S. Computer Science · CMU" },
  { key: "experience", value: "Staff Engineer · 7 years" },
  { key: "skills", value: "TypeScript, Prisma, Next.js" },
  { key: "confidence", value: "0.94" },
];

export function LandingCommandPreview() {
  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-[24px] border border-[#1a2870] p-4 sm:p-5"
        style={{
          background:
            "radial-gradient(circle at 12% 0%, rgba(27,44,193,0.45), transparent 42%), linear-gradient(165deg, #091540, #0c1529 70%)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.16em] text-[#ABD2FA]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Senior Frontend Engineer
            </p>
            <p className="text-sm font-medium text-white">Pipeline · live sample</p>
          </div>
          <div className="relative flex h-[72px] w-[72px] items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(171,210,250,0.12)" strokeWidth="4" />
              <circle
                className="animate-score-ring"
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#7692FF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="126"
                strokeDashoffset="16"
              />
            </svg>
            <span
              className="absolute text-[11px] font-semibold text-white"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              87
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid grid-cols-3 gap-2">
            {columns.map((column) => (
              <div key={column.name} className="rounded-xl bg-black/20 p-2">
                <p
                  className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#5f8ea0]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {column.name}
                </p>
                <div className="space-y-2">
                  {column.cards.map((card) => (
                    <div
                      key={card.name}
                      className="rounded-lg border border-white/[0.06] bg-[#0c1529]/80 px-2.5 py-2"
                    >
                      <p className="text-[12px] font-medium text-white">{card.name}</p>
                      <p className="mt-1 text-[10px] text-[#ABD2FA]">
                        {card.skill} · {card.score}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p
              className="mb-3 text-[10px] uppercase tracking-[0.14em] text-[#5ea7c5]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              parsed resume
            </p>
            <ul className="space-y-2">
              {parsed.map((row, index) => (
                <li
                  key={row.key}
                  className="animate-parse-line rounded-lg bg-white/[0.03] px-2.5 py-2"
                  style={{ animationDelay: `${index * 0.35}s` }}
                >
                  <span
                    className="block text-[10px] uppercase tracking-[0.1em] text-[#5f8ea0]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {row.key}
                  </span>
                  <span className="text-[12px] text-[#f1f5f9]/85">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
