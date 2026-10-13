import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { clerkEnabled } from '@/lib/clerk';
import { buildCsp } from '@/lib/csp';
import { devLoginSkipped, sessionCookieName, verifySessionToken, type Role } from '@/lib/session';
import { updateSession } from '@/utils/supabase/middleware';

// Optimistic cookie check; dashboard layouts verify the session again on the server
function dashboardGuard(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role: Role | null = pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin'
    : pathname === '/partner' || pathname.startsWith('/partner/') ? 'partner'
    : null;
  if (!role) return null;

  const dashboardPath = `/${role}`;
  const loginPath = `/${role}/login`;
  // Local dev: no login screen at all, go straight to the dashboard
  if (devLoginSkipped()) return pathname === loginPath ? NextResponse.redirect(new URL(dashboardPath, req.url)) : null;
  const loggedIn = verifySessionToken(req.cookies.get(sessionCookieName(role))?.value, role) !== null;

  if (pathname === loginPath) {
    return loggedIn ? NextResponse.redirect(new URL(dashboardPath, req.url)) : null;
  }
  return loggedIn ? null : NextResponse.redirect(new URL(loginPath, req.url));
}

// Behind a proxy or load balancer that terminates TLS (Vercel already redirects on its own)
function forceHttps(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_HTTP === 'true') return null;
  if (req.headers.get('x-forwarded-proto') !== 'http') return null;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test((req.headers.get('host') ?? '').replace(/:\d+$/, ''))) return null; // `next start` on your own machine
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return null;
  return NextResponse.redirect(`https://${host}${req.nextUrl.pathname}${req.nextUrl.search}`, 308);
}

async function handle(req: NextRequest) {
  const https = forceHttps(req);
  if (https) return https;

  const guard = dashboardGuard(req);
  if (guard) return guard;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const reqWithHeaders = new NextRequest(req, {
    headers: requestHeaders,
  });

  const res = (await updateSession(reqWithHeaders)) ?? NextResponse.next({
    request: { headers: requestHeaders },
  });

  res.headers.set('Content-Security-Policy', csp);
  return res;
}

// With Clerk keys set, Clerk's middleware runs first so player sessions are available everywhere
export const proxy = clerkEnabled ? clerkMiddleware((_auth, req) => handle(req)) : handle;

export const config = {
  // Everything except static files and image optimisation
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html)$).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
