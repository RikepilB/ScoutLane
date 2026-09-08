import Link from "next/link";

interface CareersNavProps {
  session: { user?: { email?: string } } | null;
}

export function CareersNav({ session }: CareersNavProps) {
  return (
    <nav className="mb-9 flex items-center justify-between py-2">
      <Link href="/" className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] font-bold text-paper">
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
            className="inline-flex items-center gap-2 rounded-control border border-border-dark-strong px-4 py-2 text-[14px] font-medium text-paper/80 transition-colors hover:border-sky/40 hover:text-paper"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
