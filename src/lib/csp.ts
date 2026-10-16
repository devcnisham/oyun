// Clerk's Frontend API host is encoded in the publishable key (pk_test_/pk_live_ + base64("host$"))
export function clerkFrontendApi(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return '';
  try {
    const host = Buffer.from(key.split('_')[2] ?? '', 'base64').toString('utf8').replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : '';
  } catch {
    return '';
  }
}

/**
 * Builds Content-Security-Policy header.
 * When a nonce is provided:
 * - Drops 'unsafe-inline'
 * - Uses 'nonce-${nonce}' and for modern browsers
 */
export function buildCsp(nonce?: string, isDev = process.env.NODE_ENV !== 'production'): string {
  const clerk = clerkFrontendApi();
  const clerkScript = clerk ? ` ${clerk} https://challenges.cloudflare.com` : '';
  const clerkConnect = clerk ? ` ${clerk}` : '';
  const clerkFrame = clerk ? ` https://challenges.cloudflare.com` : '';

  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''} https://cdnjs.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com${clerkScript}`
    : `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://cdnjs.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com${clerkScript}`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://vitals.vercel-insights.com${clerkConnect}${isDev ? ' ws:' : ''}`,
    `frame-src${clerkFrame || " 'none'"}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
