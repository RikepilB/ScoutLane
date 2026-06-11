export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#0c1529" }}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="inline-flex h-14 w-14 animate-pulse items-center justify-center rounded-[16px] text-white"
          style={{
            background: "linear-gradient(135deg, #1B2CC1, #161fa8)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "24px",
            letterSpacing: "-0.04em",
          }}
        >
          SL
        </div>
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    </div>
  );
}
