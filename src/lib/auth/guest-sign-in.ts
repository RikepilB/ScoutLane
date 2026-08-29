"use server";

import { signInAsDemo, type DemoSignInFailure } from "./demo-sign-in";

/** @deprecated Use signInAsDemo("guest") — kept for backward compatibility. */
export async function signInAsGuest(
  callbackUrl = "/admin",
): Promise<DemoSignInFailure | never> {
  return signInAsDemo("guest", callbackUrl);
}
