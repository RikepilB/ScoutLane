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

function getAllowedEmailDomain(): string | undefined {
  return process.env.AUTH_ALLOWED_EMAIL_DOMAIN?.toLowerCase().trim().replace(/^@/, "") || undefined;
}

/**
 * NextAuth `signIn` callback logic, extracted for unit testing.
 *
 * - Dev Credentials provider: upsert an ADMIN `User` row (and an org) so admin
 *   Server Actions that look up the user by email always succeed locally. A DB
 *   failure here must never block dev sign-in.
 * - Google provider: optionally gate by `AUTH_ALLOWED_EMAIL_DOMAIN`, promote
 *   `INITIAL_ADMIN_EMAIL` to ADMIN, and upsert every signed-in user with an
 *   organization attached (the Prisma adapter creates users without one, which
 *   breaks org-scoped routes). Existing roles and org memberships are never
 *   downgraded or reassigned.
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

  const allowedDomain = getAllowedEmailDomain();
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    return false;
  }

  const initialAdminEmail = getInitialAdminEmail();
  const isInitialAdmin = Boolean(initialAdminEmail && email === initialAdminEmail);

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { organizationId: true },
    });
    const organizationId = existing?.organizationId ?? (await resolveOrganizationId());

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: user.name ?? null,
        image: user.image ?? null,
        role: isInitialAdmin ? "ADMIN" : "RECRUITER",
        ...(organizationId ? { organizationId } : {}),
      },
      update: {
        // Never downgrade an existing role; only the initial admin is promoted.
        ...(isInitialAdmin ? { role: "ADMIN" as const } : {}),
        // Attach an org only when the user has none; never reassign membership.
        ...(existing && !existing.organizationId && organizationId ? { organizationId } : {}),
      },
    });
  } catch {
    // A transient DB error must not block OAuth sign-in; the JWT callback
    // falls back to the default RECRUITER role.
    return true;
  }
  return true;
}
