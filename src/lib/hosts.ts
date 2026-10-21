// Which part of OYUN each hostname serves (oyun.co.in is the public landing page, each audience has its own subdomain):
//   www.oyun.co.in (and oyun.co.in)  landing page
//   app.oyun.co.in                   main customer application (home, turfs, profile, saved, bookings)
//   book.oyun.co.in                  booking interface (a turf's slot picker and checkout, tickets)
//   help.oyun.co.in                  booking guides and FAQs
//   partner.oyun.co.in               turf owner dashboard
//   admin.oyun.co.in                 OYUN admin dashboard
// Any other host (localhost, the *.vercel.app address, previews) is left alone, so development and testing behave as before.

export const ROOT_DOMAIN = 'oyun.co.in';
export type HostRole = 'landing' | 'app' | 'book' | 'help' | 'partner' | 'admin' | 'preview';

// The booking site opens to the public at launch (31 October 2026, 12:00 am India time, same moment as the countdown).
// Before then the player pages are closed. LAUNCH_OPEN=true opens them early. Dashboards are never gated.
export const LAUNCH_AT = new Date('2026-10-31T00:00:00+05:30').getTime();
export const isLaunched = (now: number = Date.now(), open: string | undefined = process.env.LAUNCH_OPEN) => open === 'true' || now >= LAUNCH_AT;

// Cookie that lets the team see the booking site before launch (set by visiting any page with ?preview=<LAUNCH_PREVIEW_KEY>)
export const PREVIEW_COOKIE = 'oyun_preview';
export function previewAllowed(cookie: string | undefined, key: string | undefined) {
  if (!key || key.length < 16 || !cookie || cookie.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ cookie.charCodeAt(i);
  return diff === 0;
}

const ROLE_BY_HOST: Record<string, HostRole> = {
  [ROOT_DOMAIN]: 'landing',
  [`www.${ROOT_DOMAIN}`]: 'landing',
  [`app.${ROOT_DOMAIN}`]: 'app',
  [`book.${ROOT_DOMAIN}`]: 'book',
  [`help.${ROOT_DOMAIN}`]: 'help',
  [`partner.${ROOT_DOMAIN}`]: 'partner',
  [`admin.${ROOT_DOMAIN}`]: 'admin',
};

export const hostFor = (role: HostRole) => (role === 'landing' ? `www.${ROOT_DOMAIN}` : `${role}.${ROOT_DOMAIN}`);

export function roleForHost(hostHeader: string | null | undefined): HostRole | null {
  const host = (hostHeader ?? '').toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  // The *.vercel.app address serves the same site, so it follows the same launch gate
  if (/^[a-z0-9-]+\.vercel\.app$/.test(host)) return 'preview';
  return ROLE_BY_HOST[host] ?? null;
}

export type HostRoute = { kind: 'next' } | { kind: 'rewrite'; path: string } | { kind: 'redirect'; host: string; path: string };

// Pages the landing host serves itself. Everything else belongs to another host and is sent there.
const LANDING_PAGES = new Set(['/welcome', '/about', '/privacy', '/terms', '/faq']);
// help.: booking guides and FAQs, plus the legal pages
const HELP_AREAS = ['/help', '/faq', '/guides', '/privacy', '/terms'];
// Files and endpoints every host serves (search engines, the install manifest, health checks, share images)
const SHARED = /^\/(api|_next|__clerk)(\/|$)|^\/(robots\.txt|sitemap\.xml|manifest\.webmanifest|opengraph-image|twitter-image|icon|apple-icon)(\/|$)/;

const inArea = (path: string, area: string) => path === area || path.startsWith(`${area}/`);

export interface Access {
  // Past launch, or LAUNCH_OPEN=true: the player site is public and the landing host hands over to it
  launched: boolean;
  // A team member with the preview cookie: sees the player site before launch (the landing host still shows the landing page)
  preview: boolean;
}

const isHelp = (p: string) => HELP_AREAS.some((a) => inArea(p, a));
// A turf's own page (slot picker and checkout) and a ticket: the booking interface lives on book.
const isBooking = (p: string) => /^\/arenas\/[^/]+(\/|$)/.test(p) || /^\/bookings\/[^/]+(\/|$)/.test(p);
// Player sign-in pages, which the booking interface needs when someone must sign in before paying
const isPlayerAuth = (p: string) => /^\/(login|signup|sso-callback)(\/|$)/.test(p);

const to = (role: HostRole, path: string): HostRoute => ({ kind: 'redirect', host: hostFor(role), path });

export function routeForHost(role: HostRole | null, pathname: string, access: Access = { launched: false, preview: false }): HostRoute {
  if (!role || SHARED.test(pathname)) return { kind: 'next' };
  const playerSiteOpen = access.launched || access.preview;
  const dashboard = (): HostRoute | null => (inArea(pathname, '/partner') ? to('partner', pathname) : inArea(pathname, '/admin') ? to('admin', pathname) : null);
  // Closed pages send visitors to the landing page (the pages it serves keep their own address)
  const toLanding = (): HostRoute => to('landing', LANDING_PAGES.has(pathname) ? pathname : '/');
  // Where a page that does not belong on this host goes
  const elsewhere = (): HostRoute => (isHelp(pathname) ? to('help', pathname) : isBooking(pathname) ? to('book', pathname) : to('app', pathname));

  switch (role) {
    case 'landing':
      if (dashboard()) return dashboard()!;
      // After launch the landing host hands over to the app
      if (access.launched) return elsewhere();
      if (pathname === '/') return { kind: 'rewrite', path: '/welcome' };
      if (LANDING_PAGES.has(pathname)) return { kind: 'next' };
      if (isHelp(pathname)) return to('help', pathname);
      return playerSiteOpen ? elsewhere() : toLanding();
    case 'app':
      if (dashboard()) return dashboard()!;
      if (!playerSiteOpen) return toLanding();
      return isHelp(pathname) ? to('help', pathname) : isBooking(pathname) ? to('book', pathname) : { kind: 'next' };
    case 'book':
      if (dashboard()) return dashboard()!;
      if (!playerSiteOpen) return toLanding();
      if (isBooking(pathname) || isPlayerAuth(pathname)) return { kind: 'next' };
      return isHelp(pathname) ? to('help', pathname) : to('app', pathname);
    case 'help':
      // Guides and FAQs are public content: not behind the launch gate
      if (pathname === '/') return to('help', '/help');
      if (isHelp(pathname)) return { kind: 'next' };
      return playerSiteOpen ? elsewhere() : toLanding();
    case 'preview':
      // The *.vercel.app address serves the whole site: dashboards stay reachable, player pages follow the launch gate
      if (inArea(pathname, '/partner') || inArea(pathname, '/admin')) return { kind: 'next' };
      return playerSiteOpen || isHelp(pathname) ? { kind: 'next' } : toLanding();
    case 'partner':
    case 'admin': {
      const area = `/${role}`;
      // A redirect rather than a rewrite, so the login guard (which reads the URL) sees the real dashboard path
      if (pathname === '/') return to(role, area);
      if (inArea(pathname, area)) return { kind: 'next' };
      if (dashboard()) return dashboard()!; // the other dashboard
      return playerSiteOpen ? elsewhere() : toLanding();
    }
  }
}
