import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  other: {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noai, noimageai, nollms",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
