import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySessionToken, type Role } from '@/lib/session';
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

export async function proxy(req: NextRequest) {
  return forceHttps(req) ?? dashboardGuard(req) ?? (await updateSession(req));
}

export const config = {
  // Everything except static files and image optimisation
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html)$).*)'],
};
