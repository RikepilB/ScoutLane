import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import authConfig from "./auth.config";
import { handleSignIn } from "./sign-in";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as ReturnType<typeof PrismaAdapter>,
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      return handleSignIn({ user, account });
    },
    async jwt(params) {
      const token = await authConfig.callbacks!.jwt!(params);
      const email = (params.token.email ?? params.user?.email)
        ?.toString()
        .toLowerCase()
        .trim();
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
});
