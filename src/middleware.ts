import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuth = !!session;
  const role = session?.user?.role;

  const isPublic =
    pathname === "/" ||
    pathname === "/signin" ||
    pathname === "/api/health" ||
    pathname === "/careers" ||
    pathname.startsWith("/careers/") ||
    pathname.startsWith("/api/public/");

  if (isPublic) return NextResponse.next();

  if (!isAuth) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const deniedUrl = new URL("/access-denied", req.url);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|careers).*)"],
};
