"use client";

import { SidebarNav, type SidebarUser } from "./SidebarNav";

export type { SidebarUser };

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col md:border-r md:border-border/70 md:bg-card">
      <SidebarNav user={user} />
    </aside>
  );
}
