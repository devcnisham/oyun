# Domains and subdomains

`oyun.co.in` is the public landing page. Each audience has its own subdomain. Routing lives in `src/lib/hosts.ts` and `src/proxy.ts`; any other host (localhost, `*.vercel.app`, previews) is left alone.

| Host | Shows | Notes |
|---|---|---|
| `oyun.co.in` | redirects to `www` | Vercel domain setting (308) |
| `www.oyun.co.in` | landing page (`/welcome`), plus `/about`, `/privacy`, `/terms`, `/faq` | any other path goes to `book.` |
| `book.oyun.co.in` | player booking site | `/admin` and `/partner` go to their own hosts |
| `partner.oyun.co.in` | turf owner dashboard | `/` goes to `/partner`; other paths go to `book.` |
| `admin.oyun.co.in` | OYUN admin dashboard | `/` goes to `/admin`; other paths go to `book.` |

Redirects are 307 while the setup is new; switch to 308 once it has been stable.

## Setup (once)
1. Vercel project `slot-arena`: add `book.`, `partner.` and `admin.oyun.co.in` as domains.
2. GoDaddy DNS: a CNAME for each of `book`, `partner`, `admin` to the same target as `www`.
3. Set `NEXT_PUBLIC_SITE_URL=https://book.oyun.co.in` in Vercel once booking is live, so sitemap and canonical links point at the booking site.
4. Clerk: the production instance must allow `book.oyun.co.in` (same root domain as the instance).

At launch the landing page `/` can stop rewriting to `/welcome`: change `landing` in `routeForHost`.

## Launch gate
Until **31 October 2026, 12:00 am India time** the booking site is closed to the public, on `book.oyun.co.in` and on the `*.vercel.app` address. Visitors to a closed page go to `www.oyun.co.in` (the landing page). Dashboards (`partner.`, `admin.`, and `/partner` `/admin` on any host) and `/api/*` stay reachable.

- **Opens by itself** at the launch time. After it, `www.oyun.co.in` also serves the real site (the landing page stops showing).
- **Open early:** set `LAUNCH_OPEN=true` in Vercel.
- **Team preview before launch:** set `LAUNCH_PREVIEW_KEY` (16+ random characters) in Vercel, then open any page once with `?preview=<key>` (e.g. `https://book.oyun.co.in/?preview=<key>`). That sets a 30-day cookie on that host; `www` still shows the landing page. The key is dropped from the URL after it is read.
- Code: `isLaunched`, `previewAllowed` and `routeForHost` in `src/lib/hosts.ts`; the cookie is set in `src/proxy.ts`.
