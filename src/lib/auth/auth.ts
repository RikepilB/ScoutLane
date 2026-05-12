import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import authConfig from "./auth.config";

const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase().trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as ReturnType<typeof PrismaAdapter>,
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "dev") return true;
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

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
    },
    async jwt(params) {
      const token = await authConfig.callbacks!.jwt!(params);
      const email = (params.token.email ?? params.user?.email)
        ?.toString()
        .toLowerCase()
        .trim();
      if (email && (!token.role || token.role === "RECRUITER")) {
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
