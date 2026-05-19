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
  ADMIN: "bg-[#0c1529] text-white",
  RECRUITER: "bg-[rgba(45,111,138,0.14)] text-[#2d6f8a]",
  HIRING_MANAGER: "bg-[rgba(71,52,89,0.14)] text-[#473459]",
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
    <div className="flex h-full min-h-0 flex-1 flex-col font-[family-name:var(--font-body)]">
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-[rgba(9,21,64,0.06)]">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <span className="inline-flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1B2CC1] to-[#161fa8] text-[13px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>
            SL
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#0c1529]"
            style={{ fontFamily: "var(--font-display)" }}>
            ScoutLane
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
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
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-[0.16s]",
                active
                  ? "bg-[#0c1529] text-white"
                  : "text-[#5f8ea0] hover:bg-[#f1f5f9] hover:text-[#0c1529]",
              )}
            >
              <Icon className="h-[15px] w-[15px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[rgba(9,21,64,0.06)] p-3">
        <div className="mb-2 flex items-center gap-2.5 px-1.5 py-1">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-[#d4d9df] text-xs font-semibold text-[#394050]">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[12.5px] font-medium text-[#0c1529]">
                {user.name ?? user.email.split("@")[0]}
              </span>
              {user.role ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]",
                    rolePillStyles[user.role] ?? "bg-[#f1f5f9] text-[#394050]",
                  )}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {roleLabels[user.role] ?? user.role}
                </span>
              ) : null}
            </div>
            <div className="truncate text-[11px] text-[#5f8ea0]">{user.email}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d4d9df] px-3 py-2 text-[12.5px] font-medium text-[#5f8ea0] transition-all duration-[0.16s] hover:bg-[#f1f5f9] hover:text-[#0c1529]"
        >
          <LogOut className="h-[13px] w-[13px]" />
          Sign out
        </button>
      </div>
    </div>
  );
}
