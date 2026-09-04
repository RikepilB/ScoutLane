"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DEMO_ACCOUNTS, type DemoRole } from "./roles";

function resolveRedirectUrl(callbackUrl: string): string {
  if (callbackUrl.startsWith("http")) return callbackUrl;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${callbackUrl}`;
}

export type DemoSignInFailure = { ok: false; error: string };

/**
 * One-click demo login: mints a short-lived Clerk sign-in token for a seeded
 * demo user (admin, recruiter, or guest) and redirects into the workspace.
 * On success, redirects (never returns). On failure, returns error for UI display.
 */
export async function signInAsDemo(
  role: DemoRole,
  callbackUrl = "/admin",
): Promise<DemoSignInFailure | never> {
  const account = DEMO_ACCOUNTS[role];
  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    emailAddress: [account.email],
    limit: 1,
  });

  const user = data[0];
  if (!user) {
    return {
      ok: false,
      error: `Demo user ${account.email} is not in Clerk yet. Create that user in the Clerk Dashboard, then try again.`,
    };
  }

  let destination: URL;
  try {
    const token = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 120,
    });
    destination = new URL(token.url);
  } catch (error) {
    return {
      ok: false,
      error: `Failed to create sign-in token: ${error instanceof Error ? error.message : "unknown"}`,
    };
  }

  // next/navigation redirect() works by throwing NEXT_REDIRECT — it must stay
  // OUTSIDE the try/catch above or the catch swallows the redirect and turns a
  // successful sign-in into a reported failure.
  destination.searchParams.set("redirect_url", resolveRedirectUrl(callbackUrl));
  redirect(destination.toString());
}
