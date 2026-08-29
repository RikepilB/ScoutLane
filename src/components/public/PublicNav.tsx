"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface PublicNavProps {
  session: { user?: { email?: string } } | null;
  className?: string;
}

const links = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/jobs",
    label: "Job board",
    match: (path: string) => path === "/jobs" || path.startsWith("/careers/"),
  },
];

export function PublicNav({ session, className }: PublicNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center justify-between py-2", className)}>
      <Link href="/" className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #1B2CC1, #3D518C)",
            fontFamily: "var(--font-display)",
            fontSize: "16px",
            letterSpacing: "-0.04em",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 20px rgba(27,44,193,0.35)",
          }}
        >
          SL
        </span>
        <span className="text-[17px] font-semibold text-[#f1f5f9]" style={{ fontFamily: "var(--font-display)" }}>
          ScoutLane
        </span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        {links.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-[13px] font-medium transition-colors sm:px-4 sm:text-[14px]",
                active
                  ? "bg-white/[0.12] text-white"
                  : "text-[#f1f5f9]/70 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {link.label}
            </Link>
          );
        })}

        {session?.user ? (
          <Link
            href="/admin"
            className="ml-1 inline-flex items-center rounded-full px-3 py-2 text-[13px] font-medium text-white transition-colors sm:ml-2 sm:px-4 sm:text-[14px]"
            style={{
              background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
              boxShadow: "0 4px 14px rgba(27,44,193,0.35)",
            }}
          >
            Dashboard
          </Link>
        ) : (
          <div className="ml-1 hidden items-center gap-1 sm:ml-2 sm:flex">
            <Link
              href="/signin?as=admin"
              className="inline-flex items-center rounded-full px-3 py-2 text-[13px] font-medium text-white sm:px-4 sm:text-[14px]"
              style={{
                background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
              }}
            >
              Admin
            </Link>
            <Link
              href="/signin?as=recruiter"
              className="inline-flex items-center rounded-full border border-white/[0.16] bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.10] sm:px-4 sm:text-[14px]"
            >
              Recruiter
            </Link>
          </div>
        )}
        {!session?.user && (
          <Link
            href="/signin"
            className="ml-1 inline-flex items-center rounded-full border border-white/[0.16] bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.10] sm:hidden"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
