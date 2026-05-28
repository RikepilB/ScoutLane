import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export type AdminRole = "ADMIN" | "RECRUITER" | "HIRING_MANAGER";

export function isGoogleAuthConfigured(): boolean {
  return (
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) ||
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim())
  );
}

export function isDevLoginAllowed(): boolean {
  return process.env.NODE_ENV === "development" || !isGoogleAuthConfigured();
}

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    ...(isDevLoginAllowed()
      ? [
          Credentials({
            id: "dev",
            name: "Dev Login",
            credentials: {
              email: {
                label: "Email",
                type: "email",
                placeholder: "admin@scoutlane.local",
              },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              const email = (credentials.email as string).toLowerCase().trim();
              return {
                id: "dev-user-id",
                email,
                name: email.split("@")[0] || "Dev User",
                role: "ADMIN" as const,
              };
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: AdminRole }).role ?? "RECRUITER";
        token.userId = user.id;
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role as AdminRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) ?? session.user.id;
        session.user.role = (token.role as AdminRole) ?? "RECRUITER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
