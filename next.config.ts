import type { NextConfig } from "next";

import { buildCsp } from "./src/modules/shared/backend/csp";

const isDev = process.env.NODE_ENV !== "production";

// Fallback CSP for static pages and routes not handled by proxy
const contentSecurityPolicy = buildCsp(undefined, isDev);

const nextConfig: NextConfig = {
  // Let phones on the same Wi-Fi open the dev server (e.g. http://192.168.1.5:3000) to test the mobile app view
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  poweredByHeader: false,
  // Always define the Clerk key at build time (empty when unset) so the bundler can drop every Clerk import when sign-in is not configured
  env: { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '' },
  // Styles ship inside the HTML: four render-blocking stylesheet requests held first paint back by ~300 ms on phones
  experimental: { inlineCss: true },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Object form (not new URL) so Unsplash's ?q=&w= query strings are allowed
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/list-your-turf",
        destination: "/list-turf",
        permanent: true,
      },
      // Short addresses people expect, all served by the venue list
      { source: "/turfs", destination: "/arenas?type=turf", permanent: false },
      { source: "/courts", destination: "/arenas?type=court", permanent: false },
      { source: "/venues", destination: "/arenas", permanent: false },
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
      {
        // Google Maps frames do not opt into cross-origin isolation.
        source: '/arenas/:path*',
        headers: [{ key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' }],
      },
      {
        // Share previews: WhatsApp, Facebook, LinkedIn and Slack fetch these from another origin, so they must be loadable cross-origin
        source: '/:file(opengraph-image.*|twitter-image.*|icon.*|apple-icon.*|favicon.ico|logo.*|oyun-.*|manifest.webmanifest)',
        headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }],
      },
      {
        source: '/turfs/:file*',
        headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }],
      },
    ];
  },
};

export default nextConfig;
