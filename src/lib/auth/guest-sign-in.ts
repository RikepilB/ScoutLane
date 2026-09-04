"use server";

import { signInAsDemo, type DemoSignInFailure, type DemoSignInTicket } from "./demo-sign-in";

/** @deprecated Use signInAsDemo("guest") — kept for backward compatibility. */
export async function signInAsGuest(
  callbackUrl = "/admin",
): Promise<DemoSignInFailure | DemoSignInTicket> {
  return signInAsDemo("guest", callbackUrl);
}
