export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#17151a" }}
      aria-busy="true"
      aria-label="Loading job posting"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="inline-flex h-14 w-14 animate-pulse items-center justify-center rounded-[16px] text-paper"
          style={{
            background: "linear-gradient(135deg, #765a77, #403b79 58%, #123f59)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "24px",
            letterSpacing: "-0.04em",
          }}
        >
          SL
        </div>
        <p className="text-sm text-soft">Loading position…</p>
      </div>
    </div>
  );
}
