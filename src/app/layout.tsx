import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font: no render-blocking Google Fonts <link>, no FOUT
// on the display face, and the CSS variables below back the @theme font
// tokens (--font-display / --font-body / --font-mono) already used tree-wide.
const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});
const bodyFont = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const title = "ScoutLane — The ATS that shows its work";
const description =
  "ScoutLane parses every resume into structured data, scores candidates against the role, and runs an inspectable hiring pipeline.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: title,
    template: "%s · ScoutLane",
  },
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title,
    description,
    siteName: "ScoutLane",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const tree = (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body>
        {clerkPk ? (
          <ClerkProvider
            signInUrl="/signin"
            signInFallbackRedirectUrl="/admin"
            afterSignOutUrl="/"
          >
            {tree}
          </ClerkProvider>
        ) : (
          tree
        )}
      </body>
    </html>
  );
}
