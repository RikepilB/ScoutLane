"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { signInAsGuest } from "@/lib/auth/guest-sign-in";

export function GuestSignInButton({
  callbackUrl,
  disabled,
}: {
  callbackUrl: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const errorId = error ? "guest-signin-error" : undefined;
  const { signIn } = useSignIn();
  const { signOut, user } = useClerk();
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        aria-describedby={errorId}
        aria-busy={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              if (!signIn) {
                throw new Error("Authentication is still loading — try again in a moment.");
              }

              if (user) {
                await signOut();
              }

              const result = await signInAsGuest(callbackUrl);
              if (!result || result.ok === false) {
                throw new Error(result?.error ?? "Guest sign-in failed.");
              }

              // Redeem the sign-in token on-origin via the ticket strategy —
              // same rationale as DemoSignInButton (no account-portal redirect).
              const { error: ticketError } = await signIn.ticket({ ticket: result.ticket });
              if (ticketError) {
                throw new Error(
                  ticketError.longMessage ?? ticketError.message ?? "Sign-in token was rejected.",
                );
              }

              router.push(result.redirectTo);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Guest sign-in failed.");
            }
          });
        }}
        disabled={disabled || pending}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700/60 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Continuing…
          </>
        ) : (
          "Continue as Guest"
        )}
      </button>
      {error ? (
        <div
          id={errorId}
          className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
          role="alert"
          aria-live="polite"
        >
          <p className="text-xs font-medium text-red-300">Error:</p>
          <p className="mt-1 text-xs text-red-200">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
