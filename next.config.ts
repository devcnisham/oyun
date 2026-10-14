import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Clerk's Frontend API host is encoded in the publishable key (pk_test_/pk_live_ + base64("host$"))
function clerkFrontendApi() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return "";
  try {
    const host = Buffer.from(key.split("_")[2] ?? "", "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : "";
  } catch {
    return "";
  }
}
const clerk = clerkFrontendApi();
// Sign-in forms, their scripts and bot-protection challenge (only when Clerk is configured)
const clerkScript = clerk ? ` ${clerk} https://challenges.cloudflare.com` : "";
const clerkConnect = clerk ? ` ${clerk}` : "";
const clerkFrame = clerk ? " https://challenges.cloudflare.com" : "";

// Next.js injects inline bootstrap scripts, so script-src needs 'unsafe-inline' without nonces
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://cdnjs.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com${clerkScript}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://vitals.vercel-insights.com${clerkConnect}${isDev ? " ws:" : ""}`,
  `frame-src https://www.google.com${clerkFrame}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Let phones on the same Wi-Fi open the dev server (e.g. http://192.168.1.5:3000) to test the mobile app view
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  poweredByHeader: false,
  compress: true,
  images: {
    // webp only: AVIF encodes several times slower on a cold image cache, which cost seconds of LCP
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Object form (not new URL) so Unsplash's ?q=&w= query strings are allowed
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
  async redirects() {
    return [
      {
        source: "/list-your-turf",
        destination: "/list-turf",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            // Legacy XSS auditor is itself exploitable; CSP replaces it
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
