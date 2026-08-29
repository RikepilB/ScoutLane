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
