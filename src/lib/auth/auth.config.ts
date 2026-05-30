import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export type AdminRole = "ADMIN" | "RECRUITER" | "HIRING_MANAGER";

/**
 * Resolves the Google OAuth credentials from either the NextAuth-native
 * (`AUTH_GOOGLE_*`) or the legacy (`GOOGLE_CLIENT_*`) env names, preferring the
 * native ones. Empty strings are treated as unset so a blank `AUTH_GOOGLE_ID=""`
 * transparently falls back to `GOOGLE_CLIENT_ID`.
 */
export function resolveGoogleCredentials(): {
  clientId: string;
  clientSecret: string;
  idSource: "AUTH_GOOGLE_ID" | "GOOGLE_CLIENT_ID" | null;
  secretSource: "AUTH_GOOGLE_SECRET" | "GOOGLE_CLIENT_SECRET" | null;
} {
  const authId = process.env.AUTH_GOOGLE_ID?.trim();
  const legacyId = process.env.GOOGLE_CLIENT_ID?.trim();
  const authSecret = process.env.AUTH_GOOGLE_SECRET?.trim();
  const legacySecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return {
    clientId: authId || legacyId || "",
    clientSecret: authSecret || legacySecret || "",
    idSource: authId ? "AUTH_GOOGLE_ID" : legacyId ? "GOOGLE_CLIENT_ID" : null,
    secretSource: authSecret
      ? "AUTH_GOOGLE_SECRET"
      : legacySecret
        ? "GOOGLE_CLIENT_SECRET"
        : null,
  };
}

export function isGoogleAuthConfigured(): boolean {
  const { clientId, clientSecret } = resolveGoogleCredentials();
  return Boolean(clientId && clientSecret);
}

/**
 * Dev-only visibility into which Google credentials the running process
 * actually resolved. Surfaces a stale/wrong/empty `client_id` (the usual cause
 * of Google's `invalid_client` / "OAuth client was not found") in the server
 * log instead of failing silently at the consent screen. Never logs the secret.
 */
export function logGoogleAuthDiagnostics(): void {
  if (process.env.NODE_ENV !== "development") return;
  const { clientId, clientSecret, idSource, secretSource } = resolveGoogleCredentials();
  if (!clientId && !clientSecret) return; // dev-login-only setup; nothing to report
  const idPrefix = clientId ? `${clientId.split("-")[0]}…(${clientId.length} chars)` : "(empty)";
  if (!clientId || !clientSecret) {
    console.warn(
      `[auth] Partial Google OAuth credentials: clientId=${idPrefix} from ${idSource ?? "none"}, ` +
        `secret ${secretSource ? "set from " + secretSource : "MISSING"}. ` +
        "Google sign-in will be disabled until both are set.",
    );
    return;
  }
  console.warn(
    `[auth] Google OAuth using clientId prefix ${idPrefix} (source ${idSource}, secret source ${secretSource}). ` +
      "If sign-in returns invalid_client, this prefix must match an existing OAuth client in Google Cloud Console.",
  );
}

export function isDevLoginAllowed(): boolean {
  return process.env.NODE_ENV === "development" || !isGoogleAuthConfigured();
}

logGoogleAuthDiagnostics();

export default {
  providers: [
    ...(isGoogleAuthConfigured()
      ? [
          Google({
            clientId: resolveGoogleCredentials().clientId,
            clientSecret: resolveGoogleCredentials().clientSecret,
          }),
        ]
      : []),
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
