import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Geologica } from "next/font/google";
import "./globals.css";

// One variable family serves display, body and data surfaces. Geologica's
// CRSV/SHRP axes create hierarchy without a second face or decorative italics.
const brandFont = Geologica({
  subsets: ["latin"],
  weight: "variable",
  axes: ["CRSV", "SHRP", "slnt"],
  variable: "--font-geologica",
  display: "swap",
});

const colorThemeScript = `(()=>{try{const saved=localStorage.getItem("scoutlane-theme");const theme=saved==="light"||saved==="dark"?saved:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.scoutTheme=theme}catch{document.documentElement.dataset.scoutTheme="light"}})()`;

const title = "ScoutLane — Hiring decisions connected to evidence";
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
      className={brandFont.variable}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorThemeScript }} />
      </head>
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
