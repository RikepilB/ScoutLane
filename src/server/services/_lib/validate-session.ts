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

export async function requireSession(): Promise<AuthenticatedUser> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, organizationId: true },
  });
  if (!user) throw new Error("User not found");
  if (!user.organizationId) throw new Error("User has no organization");

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
