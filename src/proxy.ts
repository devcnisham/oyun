import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse, type NextFetchEvent } from 'next/server';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import { buildCsp } from '@/modules/shared/backend/csp';
import { PREVIEW_COOKIE, isLaunched, previewAllowed, roleForHost, routeForHost } from '@/modules/shared/backend/hosts';
import { devLoginSkipped, sessionCookieName, verifySessionToken, type Role } from '@/modules/shared/backend/session';
import { updateSession } from '@/modules/shared/database/supabase/middleware';

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

  // Clerk's Google and Apple steps live under the login and sign-up addresses and must stay reachable without a session
  const open = pathname === loginPath || pathname.startsWith(`${loginPath}/`) || (role === 'partner' && (pathname === '/partner/signup' || pathname.startsWith('/partner/signup/')));
  if (open) return pathname === loginPath && loggedIn ? NextResponse.redirect(new URL(dashboardPath, req.url)) : null;
  return loggedIn ? null : NextResponse.redirect(new URL(loginPath, req.url));
}

// Behind a proxy or load balancer that terminates TLS (Vercel already redirects on its own)
function forceHttps(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_HTTP === 'true') return null;
  if (req.headers.get('x-forwarded-proto') !== 'http') return null;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test((req.headers.get('host') ?? '').replace(/:\d+$/, ''))) return null; // `next start` on your own machine
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  // The host comes from a request header: only redirect to something that looks like a hostname
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return null;
  return NextResponse.redirect(`https://${host}${req.nextUrl.pathname}${req.nextUrl.search}`, 308);
}

// Pages prerendered at build (the ○ rows of `next build`). A per-request nonce on the request makes Next render them again
// for every visitor (private, no-store), so these skip it and let the CDN serve the prebuilt HTML. They hold no per-player
// data and no forms with user input, so the build-time policy (inline scripts allowed, hosts still allow-listed) is used.
const PRERENDERED_PAGES = new Set(['/', '/m', '/about', '/arenas', '/faq', '/help', '/list-turf', '/matches', '/privacy', '/profile', '/saved', '/settings', '/terms', '/tournaments', '/areas', '/countdown', '/landing', '/sports', '/events', '/kn', '/hi']);
// Also cached by the CDN: the turf, sport and area pages (one segment under these folders)
const PRERENDERED_FOLDERS = /^\/(arenas|sports|turfs|prices)\/[^/]+$/;
const isPrerendered = (pathname: string) => PRERENDERED_PAGES.has(pathname) || PRERENDERED_FOLDERS.test(pathname);

async function handle(req: NextRequest) {
  const https = forceHttps(req);
  if (https) return https;

  // oyun.co.in is the landing page; booking, partner and admin each have a subdomain (see lib/hosts.ts).
  // This runs before the dashboard login guard so a dashboard link on the wrong host moves to the right host first.
  const role = roleForHost(req.headers.get('x-forwarded-host') ?? req.headers.get('host'));
  const previewKey = process.env.LAUNCH_PREVIEW_KEY;
  // Visiting any page with ?preview=<key> sets a cookie that lets the team see the booking site before launch
  if (role && previewKey && req.nextUrl.searchParams.get('preview') === previewKey) {
    const clean = new URL(req.url);
    clean.searchParams.delete('preview');
    const res = NextResponse.redirect(clean, 307);
    // One cookie for every oyun.co.in subdomain, so the team opens app., book. and help. once
    const shared = /(^|\.)oyun\.co\.in$/.test((req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').replace(/:\d+$/, '')) ? { domain: '.oyun.co.in' } : {};
    res.cookies.set(PREVIEW_COOKIE, previewKey, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, ...shared });
    return res;
  }
  const route = routeForHost(role, req.nextUrl.pathname, {
    launched: isLaunched(),
    preview: previewAllowed(req.cookies.get(PREVIEW_COOKIE)?.value, previewKey),
  });
  if (route.kind === 'redirect') {
    // Old subdomains (app., book., help.) move to www with a permanent redirect so search engines pass their signals on.
    // Those keep the query string (campaign tags); the temporary launch-gate redirects drop it (it may hold the preview key).
    if (route.permanent) return NextResponse.redirect(`https://${route.host}${route.path}${req.nextUrl.search}`, req.method === 'GET' || req.method === 'HEAD' ? 301 : 308);
    return NextResponse.redirect(`https://${route.host}${route.path}`, 307);
  }
  const guard = dashboardGuard(req);
  if (guard) return guard;
  const pathname = route.kind === 'rewrite' ? route.path : req.nextUrl.pathname;

  if (req.method === 'GET' && isPrerendered(pathname)) {
    // Phones get the app-style home page, prebuilt at /m (the address bar still shows /)
    const phone = route.kind === 'next' && pathname === '/' && /Mobi|Android|iPhone|iPod/i.test(req.headers.get('user-agent') ?? '');
    const res = route.kind === 'rewrite' ? NextResponse.rewrite(new URL(route.path, req.url)) : phone ? NextResponse.rewrite(new URL('/m', req.url)) : NextResponse.next();
    res.headers.set('Content-Security-Policy', buildCsp(undefined));
    return res;
  }

  // Generate a cryptographically random nonce per request (P9-13)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  req.headers.set('x-nonce', nonce);
  req.headers.set('Content-Security-Policy', csp);

  const res = await updateSession(req);
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('x-nonce', nonce);
  return res;
}

// With Clerk keys set, Clerk's middleware runs first so player sessions are available everywhere
// Prerendered pages skip it: Clerk's middleware marks every response it touches as uncacheable
const withClerk = clerkMiddleware((_auth, req) => handle(req));
export const proxy = clerkEnabled
  ? (req: NextRequest, event: NextFetchEvent) => (req.method === 'GET' && isPrerendered(req.nextUrl.pathname) ? handle(req) : withClerk(req, event))
  : handle;

export const config = {
  // Everything except static files and image optimisation
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html)$).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
