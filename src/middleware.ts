import { auth } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  const publicPaths = ["/", "/careers", "/api/health"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!isAuth && !isPublic) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|careers).*)"],
};
