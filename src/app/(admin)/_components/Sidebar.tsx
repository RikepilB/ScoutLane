"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Briefcase, LayoutTemplate, LogOut, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
};

const navItems: NavItem[] = [
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, matchPrefix: "/admin/jobs" },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate, matchPrefix: "/admin/templates" },
  { href: "/admin/settings", label: "Settings", icon: Settings, matchPrefix: "/admin/settings" },
];

export interface SidebarUser {
  email: string;
  name?: string | null;
  role?: string;
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col md:border-r md:border-border/70 md:bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border/70 px-5">
        <Link href="/admin" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
            SL
          </span>
          ScoutLane
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin"
              ? "bg-slate-950 text-white"
              : "text-slate-700 hover:bg-slate-100",
          )}
        >
          <span className="inline-flex h-4 w-4 items-center justify-center text-[10px]">●</span>
          Dashboard
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.matchPrefix
            ? pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-900">
              {user.name ?? user.email.split("@")[0]}
            </div>
            <div className="truncate text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
