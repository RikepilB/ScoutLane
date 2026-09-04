import Link from "next/link";

export function CareersFooter() {
  return (
    <footer className="mt-[60px] flex items-center justify-between gap-3 border-t border-white/[0.08] py-7 text-[11px] uppercase tracking-[0.08em] text-white/40 max-sm:flex-col max-sm:text-center"
      style={{ fontFamily: "var(--font-mono)" }}>
      <div>&copy; 2026 ScoutLane Inc.</div>
      <div className="flex items-center gap-3">
        <a href="#" className="text-white/50 no-underline hover:text-[#ABD2FA]">Careers</a>
        <a href="#" className="text-white/50 no-underline hover:text-[#ABD2FA]">Press</a>
        <Link href="/legal#privacy" className="text-white/50 no-underline hover:text-[#ABD2FA]">Privacy</Link>
        <Link href="/legal#terms" className="text-white/50 no-underline hover:text-[#ABD2FA]">Terms</Link>
      </div>
      <div>v 4.1.2 &middot; build 8a3f</div>
    </footer>
  );
}
