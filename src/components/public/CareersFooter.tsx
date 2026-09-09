import Link from "next/link";

export function CareersFooter() {
  return (
    <footer className="mt-12 flex items-center justify-between gap-3 border-t border-border-dark py-7 text-sm text-text-inverse-muted max-sm:flex-col max-sm:text-center">
      <div>&copy; 2026 ScoutLane · Demo environment</div>
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="inline-flex min-h-11 items-center no-underline transition-colors hover:text-paper">
          Job board
        </Link>
        <a
          href="https://github.com/RikepilB/ScoutLane"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center no-underline transition-colors hover:text-paper"
        >
          GitHub
        </a>
        <Link href="/legal#privacy" className="inline-flex min-h-11 items-center no-underline transition-colors hover:text-paper">
          Privacy
        </Link>
        <Link href="/legal#terms" className="inline-flex min-h-11 items-center no-underline transition-colors hover:text-paper">
          Terms
        </Link>
      </div>
    </footer>
  );
}
