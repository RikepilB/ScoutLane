import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: [
    "@prisma/client",
    "pg",
    "@google-cloud/storage",
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
  // Apex is canonical (NEXT_PUBLIC_APP_URL). Without this, www serves a full
  // duplicate of the site on a second hostname. Kept temporary (307) rather
  // than permanent — a 308 is cached by browsers indefinitely, and the domain
  // is days old, so this stays reversible until the apex has settled.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.scoutlane.net" }],
        destination: "https://scoutlane.net/:path*",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
