import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

function assertUser(user: unknown): asserts user is AuthenticatedUser {
  if (!user) throw new Error("Not authenticated");
}

/** Throws unless the user holds a non-GUEST role. Call at the top of every mutation. */
export function assertNotGuest(user: { role: string }): void {
  if (user.role === "GUEST") {
    throw new Error("Guests have read-only access.");
  }
}

/** Throws unless the user holds one of the given roles. Call for ADMIN-only operations. */
export function requireRole(user: { role: string }, allowed: readonly string[]): void {
  if (!allowed.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}

export async function requireSession(
  opts: { allowGuest?: boolean } = {},
): Promise<AuthenticatedUser> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, organizationId: true },
  });
  if (!user) throw new Error("User not found");
  if (!user.organizationId) throw new Error("User has no organization");
  if (!opts.allowGuest) assertNotGuest(user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}

export async function getCurrentUserId(): Promise<string> {
  const user = await requireSession();
  return user.id;
}
