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

export async function proxy(req: NextRequest) {
  return dashboardGuard(req) ?? (await updateSession(req));
}

export const config = {
  // Everything except static files and image optimisation
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html)$).*)'],
};
