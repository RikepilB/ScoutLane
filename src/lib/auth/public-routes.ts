/**
 * Public-route classification used by src/middleware.ts.
 *
 * Split out so the security-sensitive matcher logic is unit-testable without
 * booting Clerk's middleware.
 */

const APP_SINGLE_SEGMENT_ROOTS = [
  "admin",
  "api",
  "careers",
  "jobs",
  "signin",
  "signup",
  "choose-role",
  "access-denied",
] as const;

const STATIC_PUBLIC_FILES =
  /^(?:robots\.txt|sitemap\.xml|manifest\.(?:json|webmanifest)|favicon\.(?:ico|svg))$/;

/**
 * True for bare single-segment paths that are not top-level app roots —
 * i.e. job shortlinks ("/my-job-slug") that the catch-all `src/app/[slug]`
 * route redirects to the public /careers page.
 *
 * IMPORTANT: any future top-level app route must be added to
 * APP_SINGLE_SEGMENT_ROOTS, otherwise it silently becomes public.
 */
export function isJobShortlinkPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  if (path === "/") return false;
  const segment = path.slice(1);
  if (!segment || segment.includes("/")) return false;
  if ((APP_SINGLE_SEGMENT_ROOTS as readonly string[]).includes(segment)) return false;
  if (STATIC_PUBLIC_FILES.test(segment)) return false;
  return true;
}
