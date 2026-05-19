"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Briefcase,
  Building2,
  Bell,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Settings,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
  exact?: boolean;
};

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, matchPrefix: "/admin/jobs" },
  { href: "/admin/applicants", label: "Applicants", icon: Users, matchPrefix: "/admin/applicants" },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplate, matchPrefix: "/admin/templates" },
  { href: "/admin/integrations", label: "Integrations", icon: Webhook, matchPrefix: "/admin/integrations" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, matchPrefix: "/admin/notifications" },
  { href: "/admin/settings", label: "Organization", icon: Building2, matchPrefix: "/admin/settings" },
];

const recruiterNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/jobs", label: "My jobs", icon: Briefcase, matchPrefix: "/admin/jobs" },
  { href: "/admin/settings", label: "Account", icon: Settings, matchPrefix: "/admin/settings" },
];

const hiringManagerNav: NavItem[] = [
  { href: "/admin/jobs", label: "My jobs", icon: Briefcase, matchPrefix: "/admin/jobs" },
  { href: "/admin/settings", label: "Account", icon: Settings, matchPrefix: "/admin/settings" },
];

function getNavItems(role: string | undefined): NavItem[] {
  if (role === "RECRUITER") return recruiterNav;
  if (role === "HIRING_MANAGER") return hiringManagerNav;
  return adminNav;
}

const rolePillStyles: Record<string, string> = {
  ADMIN: "bg-slate-950 text-white",
  RECRUITER: "bg-sky-100 text-sky-700",
  HIRING_MANAGER: "bg-violet-100 text-violet-700",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring manager",
};

export interface SidebarUser {
  email: string;
  name?: string | null;
  role?: string;
}

export function SidebarNav({
  user,
  onNavigate,
}: {
  user: SidebarUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navItems = getNavItems(user.role);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border/70 px-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
            SL
          </span>
          ScoutLane
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : item.matchPrefix
              ? pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-900">
                {user.name ?? user.email.split("@")[0]}
              </span>
              {user.role ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    rolePillStyles[user.role] ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  {roleLabels[user.role] ?? user.role}
                </span>
              ) : null}
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
    </div>
  );
}
