"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LandingThemeToggle } from "./landing/LandingThemeToggle";

interface PublicNavProps {
  session: { user?: { email?: string } } | null;
  className?: string;
  tone?: "dark" | "paper";
  showThemeToggle?: boolean;
}

const links = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/jobs",
    label: "Job board",
    match: (path: string) => path === "/jobs" || path.startsWith("/careers/"),
  },
  {
    href: "/legal",
    label: "Legal",
    match: (path: string) => path === "/legal",
  },
];

export function PublicNav({
  session,
  className,
  tone = "dark",
  showThemeToggle = false,
}: PublicNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className={cn("public-nav flex flex-wrap items-center justify-between gap-3 py-5", tone === "paper" && "public-nav-paper", className)}>
      <Link href="/" className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-control bg-brand-royal font-display text-[16px] font-bold tracking-[-0.04em] text-paper">
          SL
        </span>
        <span className="public-wordmark font-display text-[17px] font-semibold text-paper">
          ScoutLane
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {links.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "public-nav-link inline-flex min-h-11 items-center rounded-control px-3 py-2 text-[13px] font-medium transition-colors sm:px-4 sm:text-[14px]",
                active
                  ? "bg-paper/[0.12] text-paper"
                  : "text-paper/70 hover:bg-paper/[0.06] hover:text-paper",
              )}
            >
              {link.label}
            </Link>
          );
        })}

        {showThemeToggle ? <LandingThemeToggle /> : null}

        <a
          href="https://github.com/RikepilB/ScoutLane"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View ScoutLane on GitHub"
          className="public-nav-link ml-1 hidden h-11 w-11 items-center justify-center rounded-control text-paper/70 transition-colors hover:bg-paper/[0.06] hover:text-paper sm:inline-flex"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.69.08-.69 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.02 11.02 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </svg>
        </a>

        <Link
          href={session?.user ? "/admin" : "/signin"}
          className="ml-1 inline-flex min-h-11 items-center rounded-control bg-brand-royal px-3 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-brand-royal-hover sm:ml-2 sm:px-4 sm:text-[14px]"
        >
          {session?.user ? "Dashboard" : "Sign in"}
        </Link>
      </div>
    </nav>
  );
}
