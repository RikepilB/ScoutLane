"use client";

import { useState, useTransition } from "react";
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

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await signInAsGuest(callbackUrl);
            if (result && result.ok === false) {
              setError(result.error);
            }
          });
        }}
        disabled={disabled || pending}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700/60 disabled:opacity-50"
      >
        {pending ? "..." : "Continue as Guest"}
      </button>
      {error ? (
        <p className="text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
