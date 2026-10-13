import { clerkEnabled } from './clerk';

// Content Security Policy generator (task P9-13).
// Generates per-request cryptographic nonces and uses 'strict-dynamic',
// dropping 'unsafe-inline' from script-src to prevent cross-site scripting (XSS).

function clerkFrontendApi() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return '';
  try {
    const host = Buffer.from(key.split('_')[2] ?? '', 'base64').toString('utf8').replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : '';
  } catch {
    return '';
  }
}

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const clerk = clerkEnabled ? clerkFrontendApi() : '';
  const clerkScript = clerk ? ` ${clerk} https://challenges.cloudflare.com` : '';
  const clerkConnect = clerk ? ` ${clerk}` : '';
  const clerkFrame = clerk ? ' https://challenges.cloudflare.com' : '';

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://cdnjs.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com${clerkScript}`,
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
  ].join('; ');
}
