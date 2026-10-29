// Which part of OYUN each hostname serves (oyun.co.in is the public landing page, each audience has its own subdomain):
//   www.oyun.co.in (and oyun.co.in)  the whole public site (landing page before launch, everything after): the one SEO host
//   app., book., help.               old subdomains, permanent redirects to the same path on www
//   partner.oyun.co.in               turf owner dashboard
//   admin.oyun.co.in                 OYUN admin dashboard
// Any other host (localhost, the *.vercel.app address, previews) is left alone, so development and testing behave as before.

export const ROOT_DOMAIN = 'oyun.co.in';
export type HostRole = 'landing' | 'app' | 'book' | 'help' | 'partner' | 'admin' | 'preview';

// The booking site opened to the public on 22 October 2026 (12:00 am India time), nine days ahead of the planned 31 October.
// To close it again set LAUNCH_AT to a future moment; LAUNCH_OPEN=true opens it regardless. Dashboards are never gated.
export const LAUNCH_AT = new Date('2026-10-22T00:00:00+05:30').getTime();
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

export type HostRoute = { kind: 'next' } | { kind: 'rewrite'; path: string } | { kind: 'redirect'; host: string; path: string; permanent?: boolean };

// Pages the landing host serves before launch. After launch it serves the whole public site (one canonical host for SEO).
const LANDING_PAGES = new Set(['/countdown', '/about', '/privacy', '/terms', '/faq']);
// Help content: booking guides, FAQs and legal pages. Public even before launch, on www.
const HELP_AREAS = ['/help', '/faq', '/guides', '/privacy', '/terms'];
// Files and endpoints every host serves (search engines, the install manifest, health checks, share images)
const SHARED = /^\/(api|_next|__clerk)(\/|$)|^\/(robots\.txt|sitemap\.xml|manifest\.webmanifest|opengraph-image|twitter-image|icon|apple-icon)(\/|$)/;

const inArea = (path: string, area: string) => path === area || path.startsWith(`${area}/`);

export interface Access {
  // Past launch, or LAUNCH_OPEN=true: the player site is public
  launched: boolean;
  // A team member with the preview cookie: sees the player site before launch (the landing page still shows at /)
  preview: boolean;
}

const isHelp = (p: string) => HELP_AREAS.some((a) => inArea(p, a));

const to = (role: HostRole, path: string, permanent = false): HostRoute => ({ kind: 'redirect', host: hostFor(role), path, ...(permanent ? { permanent } : {}) });

// SEO: every public page lives on www.oyun.co.in so ranking signals are not split across subdomains.
// app., book. and help. are kept only as permanent redirects to the same path on www.
export function routeForHost(role: HostRole | null, pathname: string, access: Access = { launched: false, preview: false }): HostRoute {
  if (!role || SHARED.test(pathname)) return { kind: 'next' };
  const playerSiteOpen = access.launched || access.preview;
  // /welcome was the old name of the countdown page; keep old links working
  if (pathname === '/welcome' && role === 'landing') return to('landing', access.launched ? '/' : '/countdown', true);
  const dashboard = (): HostRoute | null => (inArea(pathname, '/partner') ? to('partner', pathname) : inArea(pathname, '/admin') ? to('admin', pathname) : null);
  // Before launch the closed player pages send visitors to the countdown page, so Browse & book always lands somewhere that explains why
  const toLanding = (): HostRoute => to('landing', LANDING_PAGES.has(pathname) || isHelp(pathname) ? pathname : '/countdown');

  switch (role) {
    case 'landing':
      if (dashboard()) return dashboard()!;
      if (access.launched) {
        // The countdown retires after launch; /landing remains the introduction and / is the booking home
        if (pathname === '/countdown') return to('landing', '/', true);
        return { kind: 'next' };
      }
      if (pathname === '/') return { kind: 'rewrite', path: '/landing' };
      if (LANDING_PAGES.has(pathname) || isHelp(pathname)) return { kind: 'next' };
      return playerSiteOpen ? { kind: 'next' } : toLanding();
    case 'app':
    case 'book':
    case 'help':
      if (dashboard()) return dashboard()!;
      if (role === 'help' && pathname === '/') return to('landing', '/help', true);
      // Old subdomains: permanent redirect to the same page on www (once the page is public)
      if (isHelp(pathname) || playerSiteOpen) return to('landing', pathname, true);
      return toLanding();
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
      return playerSiteOpen ? to('landing', pathname, true) : toLanding();
    }
  }
}
