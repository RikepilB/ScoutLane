"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav, type SidebarUser } from "./SidebarNav";

export function MobileNav({ user }: { user: SidebarUser }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border/70 bg-card px-4 md:hidden">
      <Link
        href="/admin"
        className="flex items-center gap-2 text-sm font-semibold tracking-tight"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">
          SL
        </span>
        ScoutLane
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
