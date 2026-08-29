import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@/generated/prisma/client";
import { GUEST_EMAIL, DEMO_RECRUITER_EMAIL, getInitialAdminEmail, type AdminRole } from "./roles";

export type SyncUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
};

async function resolveOrganizationId(): Promise<string | null> {
  const existing = await prisma.organization.findFirst({ select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.organization.create({
    data: { name: "ScoutLane", slug: "scoutlane" },
    select: { id: true },
  });
  return created.id;
}

function resolveRoleForNewUser(email: string): AdminRole {
  if (email === GUEST_EMAIL) return "GUEST";
  const initialAdmin = getInitialAdminEmail();
  if (initialAdmin && email === initialAdmin) return "ADMIN";
  if (email === DEMO_RECRUITER_EMAIL) return "RECRUITER";
  return "RECRUITER";
}

/**
 * Upsert the Prisma `User` row for a Clerk-authenticated identity.
 * Roles live in Postgres (admin-managed via Settings); Clerk handles sign-in only.
 */
export async function syncUserFromClerk(input: SyncUserInput): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  organizationId: string | null;
}> {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { organizationId: true, role: true },
  });

  const organizationId = existing?.organizationId ?? (await resolveOrganizationId());
  const isGuest = email === GUEST_EMAIL;
  const initialAdmin = getInitialAdminEmail();
  const isInitialAdmin = Boolean(initialAdmin && email === initialAdmin);
  const isDemoRecruiter = email === DEMO_RECRUITER_EMAIL;

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: input.name ?? null,
      image: input.image ?? null,
      role: resolveRoleForNewUser(email),
      ...(organizationId ? { organizationId } : {}),
    },
    update: {
      ...(isGuest ? { role: "GUEST" as const } : {}),
      ...(isInitialAdmin ? { role: "ADMIN" as const } : {}),
      ...(isDemoRecruiter ? { role: "RECRUITER" as const } : {}),
      ...(existing && !existing.organizationId && organizationId
        ? { organizationId }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
    },
  });
}
