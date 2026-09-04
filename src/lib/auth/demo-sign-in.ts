"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { DEMO_ACCOUNTS, type DemoRole } from "./roles";

export type DemoSignInFailure = { ok: false; error: string };
export type DemoSignInTicket = { ok: true; ticket: string; redirectTo: string };

/**
 * One-click demo login: mints a short-lived Clerk sign-in token for a seeded
 * demo user (admin, recruiter, or guest) and returns it for the client to
 * redeem via the ticket strategy directly on this origin.
 *
 * The token is NOT redeemed through Clerk's account portal here — the portal
 * only redirects back to origins the instance trusts (localhost for dev
 * instances), which strands deployed domains on the accounts.dev
 * "default-redirect" interstitial. Redeeming on-origin via
 * `signIn.create({ strategy: "ticket" })` works everywhere.
 */
export async function signInAsDemo(
  role: DemoRole,
  callbackUrl = "/admin",
): Promise<DemoSignInFailure | DemoSignInTicket> {
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

  try {
    const token = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 120,
    });
    return { ok: true, ticket: token.token, redirectTo: callbackUrl };
  } catch (error) {
    return {
      ok: false,
      error: `Failed to create sign-in token: ${error instanceof Error ? error.message : "unknown"}`,
    };
  }
}
