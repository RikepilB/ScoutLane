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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-[#d4d9df] bg-white px-4 md:hidden">
      <Link
        href="/admin"
        className="flex items-center gap-2"
      >
        <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-gradient-to-br from-[#1B2CC1] to-[#3D518C] text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>
          SL
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#0c1529]"
          style={{ fontFamily: "var(--font-display)" }}>
          ScoutLane
        </span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#394050] hover:bg-[#f1f5f9]"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
