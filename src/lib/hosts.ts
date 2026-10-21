// Which part of OYUN each hostname serves (oyun.co.in is the public landing page, each audience has its own subdomain):
//   www.oyun.co.in (and oyun.co.in)  landing page
//   book.oyun.co.in                  the player booking site
//   partner.oyun.co.in               turf owner dashboard
//   admin.oyun.co.in                 OYUN admin dashboard
// Any other host (localhost, the *.vercel.app address, previews) is left alone, so development and testing behave as before.

export const ROOT_DOMAIN = 'oyun.co.in';
export type HostRole = 'landing' | 'book' | 'partner' | 'admin';

const ROLE_BY_HOST: Record<string, HostRole> = {
  [ROOT_DOMAIN]: 'landing',
  [`www.${ROOT_DOMAIN}`]: 'landing',
  [`book.${ROOT_DOMAIN}`]: 'book',
  [`partner.${ROOT_DOMAIN}`]: 'partner',
  [`admin.${ROOT_DOMAIN}`]: 'admin',
};

export const hostFor = (role: HostRole) => (role === 'landing' ? `www.${ROOT_DOMAIN}` : `${role}.${ROOT_DOMAIN}`);

export function roleForHost(hostHeader: string | null | undefined): HostRole | null {
  const host = (hostHeader ?? '').toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  return ROLE_BY_HOST[host] ?? null;
}

export type HostRoute = { kind: 'next' } | { kind: 'rewrite'; path: string } | { kind: 'redirect'; host: string; path: string };

// Pages the landing host serves itself. Everything else belongs to another host and is sent there.
const LANDING_PAGES = new Set(['/welcome', '/about', '/privacy', '/terms', '/faq']);
// Files and endpoints every host serves (search engines, the install manifest, health checks, share images)
const SHARED = /^\/(api|_next|__clerk)(\/|$)|^\/(robots\.txt|sitemap\.xml|manifest\.webmanifest|opengraph-image|twitter-image|icon|apple-icon)(\/|$)/;

const inArea = (path: string, area: string) => path === area || path.startsWith(`${area}/`);

export function routeForHost(role: HostRole | null, pathname: string): HostRoute {
  if (!role || SHARED.test(pathname)) return { kind: 'next' };
  switch (role) {
    case 'landing':
      if (pathname === '/') return { kind: 'rewrite', path: '/welcome' };
      if (LANDING_PAGES.has(pathname)) return { kind: 'next' };
      if (inArea(pathname, '/partner')) return { kind: 'redirect', host: hostFor('partner'), path: pathname };
      if (inArea(pathname, '/admin')) return { kind: 'redirect', host: hostFor('admin'), path: pathname };
      return { kind: 'redirect', host: hostFor('book'), path: pathname };
    case 'book':
      // The booking site never shows the dashboards: those live on their own hosts
      if (inArea(pathname, '/partner')) return { kind: 'redirect', host: hostFor('partner'), path: pathname };
      if (inArea(pathname, '/admin')) return { kind: 'redirect', host: hostFor('admin'), path: pathname };
      return { kind: 'next' };
    case 'partner':
    case 'admin': {
      const area = `/${role}`;
      // A redirect rather than a rewrite, so the login guard (which reads the URL) sees the real dashboard path
      if (pathname === '/') return { kind: 'redirect', host: hostFor(role), path: area };
      if (inArea(pathname, area)) return { kind: 'next' };
      return { kind: 'redirect', host: hostFor('book'), path: pathname };
    }
  }
}
