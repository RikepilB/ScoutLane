"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

/**
 * Guards the sign-in page against Clerk's default "you're already signed in"
 * screens (shown by both the demo buttons and the embedded <SignIn/> widget
 * when a session is already active — confusing on a demo app where visitors
 * expect a single active workspace, not Clerk's multi-session UI).
 *
 * While signed in, replaces the sign-in UI entirely with a clear choice:
 * continue to the existing session's destination, or sign out to pick a
 * different demo workspace / use a different invite.
 */
export function SignedInGate({
  callbackUrl,
  children,
}: {
  callbackUrl: string;
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (isSignedIn) {
    const label = user.primaryEmailAddress?.emailAddress ?? user.fullName ?? "your account";
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-300">
          Already signed in as <span className="font-medium text-white">{label}</span>.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              router.push(callbackUrl);
              router.refresh();
            }}
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            Continue to dashboard
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                // Reload (not a client-side state flip) so useUser() remounts
                // clean — Clerk's isLoaded flag doesn't reliably recover from a
                // signOut() while the component that called it stays mounted.
                await signOut();
                window.location.reload();
              });
            }}
            className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800/60 disabled:opacity-50"
          >
            {isPending ? "Signing out…" : "Sign out / switch workspace"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
