import Link from "next/link";

export function CareersFooter() {
  return (
    <footer className="mt-[60px] flex items-center justify-between gap-3 border-t border-border-dark py-7 text-[13px] text-paper/50 max-sm:flex-col max-sm:text-center">
      <div>&copy; 2026 ScoutLane · Demo environment</div>
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="text-paper/50 no-underline transition-colors hover:text-paper">
          Job board
        </Link>
        <a
          href="https://github.com/RikepilB/ScoutLane"
          target="_blank"
          rel="noopener noreferrer"
          className="text-paper/50 no-underline transition-colors hover:text-paper"
        >
          GitHub
        </a>
        <Link href="/legal#privacy" className="text-paper/50 no-underline transition-colors hover:text-paper">
          Privacy
        </Link>
        <Link href="/legal#terms" className="text-paper/50 no-underline transition-colors hover:text-paper">
          Terms
        </Link>
      </div>
    </footer>
  );
}
