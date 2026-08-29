import Link from "next/link";

interface CareersNavProps {
  session: { user?: { email?: string } } | null;
}

export function CareersNav({ session }: CareersNavProps) {
  return (
    <nav className="mb-9 flex items-center justify-between py-2">
      <Link href="/" className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #1B2CC1, #3D518C)",
            fontFamily: "var(--font-display)",
            fontSize: "16px",
            letterSpacing: "-0.04em",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 20px rgba(27,44,193,0.35)",
          }}>
          SL
        </span>
        <span className="text-[17px] font-semibold"
          style={{ fontFamily: "var(--font-display)" }}>
          ScoutLane
        </span>
      </Link>
      <div className="flex items-center gap-2.5">
        {!session?.user && (
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.10] hover:border-white/[0.20]"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
