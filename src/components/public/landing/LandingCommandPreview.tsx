const parsed = [
  { key: "Experience", value: "Staff Engineer · 7 years" },
  { key: "Education", value: "M.S. Computer Science · CMU" },
  { key: "Skills", value: "TypeScript, Prisma, Next.js" },
];

export function LandingCommandPreview() {
  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-[28px] border border-white/[0.08] p-8 sm:p-10"
        style={{
          background: "linear-gradient(165deg, #0d1a4a, #0c1529 65%)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="mb-9 flex items-start justify-between gap-4">
          <div>
            <p
              className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[#ABD2FA]/70"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Senior Frontend Engineer
            </p>
            <p className="text-lg font-medium text-white">Priya Shah</p>
          </div>
          <div className="flex flex-col items-end">
            <span
              className="text-3xl font-semibold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              0.91
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.14em] text-[#f1f5f9]/40"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              job-fit score
            </span>
          </div>
        </div>

        <div className="space-y-5 border-t border-white/[0.08] pt-6">
          {parsed.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between gap-4">
              <span
                className="text-[11px] uppercase tracking-[0.12em] text-[#f1f5f9]/40"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {row.key}
              </span>
              <span className="text-right text-sm text-[#f1f5f9]/85">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
