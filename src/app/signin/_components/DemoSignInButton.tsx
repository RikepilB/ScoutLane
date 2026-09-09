"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { signInAsDemo } from "@/lib/auth/demo-sign-in";
import type { DemoRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils/cn";

// Both roles carry the same visual weight — the choice between admin and
// recruiter is a fork, not a hierarchy, so neither button may look primary.
const roleStyles: Record<Exclude<DemoRole, "guest">, string> = {
  admin: "bg-brand-royal text-paper transition-colors hover:bg-brand-royal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
  recruiter:
    "bg-brand-royal text-paper transition-colors hover:bg-brand-royal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
};

const TIMEOUT_MS = 12_000;

export function DemoSignInButton({
  role,
  callbackUrl = "/admin",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
}: {
  role: Exclude<DemoRole, "guest">;
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceId = useId();
  const errorId = error ? `${instanceId}-error` : undefined;
  const [, startTransition] = useTransition();
  const { signIn } = useSignIn();
  const { signOut, user } = useClerk();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setPending(true);

          // Hard ceiling so a stalled navigation/network call never leaves the
          // button spinning forever with no way out for the user.
          timeoutRef.current = setTimeout(() => {
            setPending(false);
            setError("Taking too long — refresh the page and try again.");
          }, TIMEOUT_MS);

          startTransition(async () => {
            try {
              if (!signIn) {
                throw new Error("Authentication is still loading — try again in a moment.");
              }

              // Switching demo workspaces (or re-entering one) while a session is
              // already active fails with "already signed in" from Clerk — sign
              // out first so the ticket below always redeems into a fresh session.
              if (user) {
                await signOut();
              }

              const result = await signInAsDemo(role, callbackUrl);
              if (!result || result.ok === false) {
                throw new Error(result?.error ?? "Demo sign-in failed.");
              }

              // Redeem the sign-in token directly on this origin via the
              // ticket strategy, then explicitly activate it. The installed
              // Clerk API separates ticket verification from session activation.
              const { error: ticketError } = await signIn.ticket({ ticket: result.ticket });
              if (ticketError) {
                throw new Error(
                  ticketError.longMessage ?? ticketError.message ?? "Sign-in token was rejected.",
                );
              }

              const { error: activationError } = await signIn.finalize();
              if (activationError) {
                throw new Error(
                  activationError.longMessage ?? activationError.message ?? "Session activation failed.",
                );
              }

              router.push(result.redirectTo);
              router.refresh();
              // Deliberately leave `pending` true here: the button is about to be
              // unmounted by the navigation. If that navigation stalls, the
              // timeout above still fires and recovers the button.
            } catch (e) {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setError(e instanceof Error ? e.message : "Demo sign-in failed.");
              setPending(false);
            }
          });
        }}
        disabled={pending}
        aria-label={ariaLabel}
        aria-describedby={[ariaDescribedby, errorId].filter(Boolean).join(" ") || undefined}
        aria-busy={pending}
        className={cn(
          "inline-flex items-center justify-center rounded-control px-6 py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed",
          roleStyles[role],
          className,
        )}
      >
        {pending ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Entering workspace…
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
          <p className="text-sm font-semibold text-paper">Unable to enter workspace</p>
          <p className="mt-1 text-sm text-paper">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-paper underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Refresh page
          </button>
        </div>
      ) : null}
    </div>
  );
}
