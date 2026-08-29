"use client";

import { useState, useTransition } from "react";
import { signInAsDemo } from "@/lib/auth/demo-sign-in";
import type { DemoRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils/cn";

const roleStyles: Record<Exclude<DemoRole, "guest">, string> = {
  admin:
    "bg-gradient-to-b from-[#1B2CC1] to-[#161fa8] shadow-[0_8px_20px_rgba(27,44,193,0.4),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-0.5",
  recruiter:
    "border border-[#5ea7c5]/40 bg-[#14213d] shadow-[0_8px_20px_rgba(94,167,197,0.18)] hover:bg-[#1a2c4d] hover:-translate-y-0.5",
};

export function DemoSignInButton({
  role,
  callbackUrl = "/admin",
  className,
  children,
}: {
  role: Exclude<DemoRole, "guest">;
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setPending(true);
          startTransition(async () => {
            const result = await signInAsDemo(role, callbackUrl);
            if (result && result.ok === false) {
              setError(result.error);
              setPending(false);
            }
          });
        }}
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60",
          roleStyles[role],
          className,
        )}
      >
        {pending ? "Entering workspace…" : children}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
