import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieName, verifySessionToken, type Role } from '@/lib/session';

// Optimistic cookie check; dashboard layouts verify the session again on the server
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role: Role = pathname.startsWith('/admin') ? 'admin' : 'partner';
  const dashboardPath = `/${role}`;
  const loginPath = `/${role}/login`;

  const loggedIn = verifySessionToken(req.cookies.get(sessionCookieName(role))?.value, role) !== null;

  if (pathname === loginPath) {
    return loggedIn ? NextResponse.redirect(new URL(dashboardPath, req.url)) : NextResponse.next();
  }

  if (!loggedIn) {
    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/partner/:path*'],
};
