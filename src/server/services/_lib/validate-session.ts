import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, organizationId: true },
  });
  if (!user) throw new Error("User not found");

  return user.id;
}
