"use client";

import { SidebarNav, type SidebarUser } from "./SidebarNav";

export type { SidebarUser };

export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] flex-shrink-0 flex-col overflow-y-auto border-r border-[#d4d9df] bg-white md:flex">
      <SidebarNav user={user} />
    </aside>
  );
}
