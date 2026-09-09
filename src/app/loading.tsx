export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-paper"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="inline-flex h-14 w-14 items-center justify-center rounded-control bg-brand-royal text-paper"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "24px",
            letterSpacing: "-0.04em",
          }}
        >
          SL
        </div>
        <p className="text-sm text-steel">Loading…</p>
      </div>
    </div>
  );
}
