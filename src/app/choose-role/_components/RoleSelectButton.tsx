"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/lib/auth/set-user-role";
import type { UserRole } from "@/generated/prisma/client";
import { cn } from "@/lib/utils/cn";

const roleStyles: Record<UserRole, string> = {
  ADMIN:
    "bg-gradient-to-b from-brand-royal to-brand-royal-dark shadow-[0_8px_20px_rgba(27,44,193,0.4),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
  RECRUITER:
    "border border-cyan/40 bg-ink-800 shadow-[0_8px_20px_rgba(94,167,197,0.18)] hover:bg-ink-800 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
  HIRING_MANAGER:
    "border border-cyan/40 bg-ink-800 shadow-[0_8px_20px_rgba(94,167,197,0.18)] hover:bg-ink-800 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
  GUEST:
    "border border-ink-700/40 bg-ink-800/40 shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-ink-800/60 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
};

export function RoleSelectButton({
  role,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
}: {
  role: UserRole;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = error ? "role-select-error" : undefined;
  const [, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setPending(true);
          startTransition(async () => {
            const result = await setUserRole(role);
            if (!result.ok) {
              setError(result.error || "Failed to set role");
              setPending(false);
            } else {
              router.push("/admin");
            }
          });
        }}
        disabled={pending}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby || errorId}
        aria-busy={pending}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed",
          roleStyles[role],
          className,
        )}
      >
        {pending ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Setting up workspace…
          </>
        ) : (
          children
        )}
      </button>
      {error ? (
        <div
          id={errorId}
          className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3"
          role="alert"
          aria-live="polite"
        >
          <p className="text-xs font-medium text-danger">Error:</p>
          <p className="mt-1 text-xs text-danger">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
