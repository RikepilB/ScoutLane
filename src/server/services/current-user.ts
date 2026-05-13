"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentUserWithOrganization() {
  const session = await auth();
  const sessionEmail = session?.user?.email;

  if (!sessionEmail) return null;

  const user = await prisma.user.findUnique({
    where: { email: sessionEmail },
    include: { organization: true },
  });

  if (!user) return null;

  if (user.organizationId) return user;

  const fallbackOrganization = await prisma.organization.create({
    data: {
      name: "ScoutLane",
      slug: `scoutlane-${user.id.slice(0, 8)}`,
    },
  });

  return prisma.user.update({
    where: { id: user.id },
    data: { organizationId: fallbackOrganization.id },
    include: { organization: true },
  });
}
