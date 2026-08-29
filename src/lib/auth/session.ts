import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { syncUserFromClerk } from "./sync-user";
import type { AdminRole } from "./roles";

export type AppSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
};

export type AppSession = {
  user: AppSessionUser;
};

function primaryEmail(
  clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string | null {
  const primary = clerkUser.emailAddresses.find(
    (entry) => entry.id === clerkUser.primaryEmailAddressId,
  );
  return (primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress)?.toLowerCase() ?? null;
}

/**
 * Drop-in replacement for the old NextAuth `auth()` helper used across ScoutLane.
 * Returns org-scoped user metadata from Prisma after syncing the Clerk identity.
 */
export async function getAppSession(): Promise<AppSession | null> {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = primaryEmail(clerkUser);
  if (!email) return null;

  const dbUser = await syncUserFromClerk({
    email,
    name: clerkUser.fullName ?? clerkUser.firstName ?? null,
    image: clerkUser.imageUrl ?? null,
  });

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as AdminRole,
    },
  };
}
