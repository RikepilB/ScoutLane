"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@/generated/prisma/client";

export async function setUserRole(role: UserRole) {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, error: "Not authenticated" };
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  if (!email) {
    return { ok: false, error: "No email found" };
  }

  try {
    // Only allow role selection on initial signup (when role is GUEST or unset)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true, id: true },
    });

    if (existingUser && existingUser.role !== "GUEST" && existingUser.role !== null) {
      return { ok: false, error: "Role already assigned" };
    }

    await prisma.user.update({
      where: { email },
      data: { role },
    });

    return { ok: true };
  } catch (error) {
    console.error("Error setting user role:", error);
    return { ok: false, error: "Failed to set role" };
  }
}
