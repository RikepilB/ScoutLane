import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

/** Roles that may use the internal workspace (`/admin`, `/api/admin`). */
const WORKSPACE_ROLES = new Set(["ADMIN", "RECRUITER", "HIRING_MANAGER", "GUEST"]);

const PUBLIC_FILES = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuth = !!session;
  const role = session?.user?.role;

  const isPublic =
    pathname === "/" ||
    pathname === "/signin" ||
    pathname === "/access-denied" ||
    pathname === "/api/health" ||
    pathname === "/careers" ||
    pathname.startsWith("/careers/") ||
    pathname.startsWith("/api/public/") ||
    pathname.startsWith("/api/resumes/") ||
    PUBLIC_FILES.has(pathname);

  if (isPublic) return NextResponse.next();

  if (!isAuth) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    !WORKSPACE_ROLES.has(role ?? "")
  ) {
    const deniedUrl = new URL("/access-denied", req.url);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/public|api/resumes|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.(?:json|webmanifest)|careers).*)",
  ],
};
