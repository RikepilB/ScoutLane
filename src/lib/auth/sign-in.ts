import { prisma } from "@/lib/db/prisma";

type SignInParams = {
  user: { email?: string | null; name?: string | null; image?: string | null };
  account?: { provider?: string | null } | null;
};

function getInitialAdminEmail(): string | undefined {
  return process.env.INITIAL_ADMIN_EMAIL?.toLowerCase().trim() || undefined;
}

/**
 * Resolve an organization to attach a freshly-provisioned dev admin to.
 * Reuses the first existing org (seeded ScoutLane org in dev) and only
 * creates one when the database is empty.
 */
async function resolveOrganizationId(): Promise<string | null> {
  const existing = await prisma.organization.findFirst({ select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.organization.create({
    data: { name: "ScoutLane", slug: "scoutlane" },
    select: { id: true },
  });
  return created.id;
}

/**
 * NextAuth `signIn` callback logic, extracted for unit testing.
 *
 * - Dev Credentials provider: upsert an ADMIN `User` row (and an org) so admin
 *   Server Actions that look up the user by email always succeed locally. A DB
 *   failure here must never block dev sign-in.
 * - Google provider: promote `INITIAL_ADMIN_EMAIL` to ADMIN on first login.
 */
export async function handleSignIn({ user, account }: SignInParams): Promise<boolean> {
  const email = user.email?.toLowerCase().trim();

  if (account?.provider === "dev") {
    if (!email) return true;
    try {
      const organizationId = await resolveOrganizationId();
      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name ?? email.split("@")[0],
          image: user.image ?? null,
          role: "ADMIN",
          ...(organizationId ? { organizationId } : {}),
        },
        update: { role: "ADMIN" },
      });
    } catch {
      // Dev sign-in must never be blocked by a transient DB error.
    }
    return true;
  }

  if (!email) return false;

  const initialAdminEmail = getInitialAdminEmail();
  if (initialAdminEmail && email === initialAdminEmail) {
    try {
      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: "ADMIN",
        },
        update: { role: "ADMIN" },
      });
    } catch {
      return true;
    }
  }
  return true;
}
