# Domains and subdomains

**SEO update:** all public pages are served from `www.oyun.co.in` only. The table below describes the older split; `app.`, `book.` and `help.` now only redirect to `www`. Help content (`/help`, `/faq`, `/guides`) is served on `www` even before launch.

`oyun.co.in` is the public landing page. Each audience has its own subdomain. Routing lives in `src/lib/hosts.ts` and `src/proxy.ts`; any other host (localhost, `*.vercel.app`, previews) is left alone.

| Host | Shows | Notes |
|---|---|---|
| `oyun.co.in` | redirects to `www` | Vercel domain setting (308) |
| `www.oyun.co.in` | marketing landing page (`/` is rewritten to `/landing`), the "Launching soon" countdown page (`/countdown`; `/welcome` redirects there), `/about`, `/privacy`, `/terms`, `/faq`. Browse & book buttons open `app.` | after launch it hands over to `app.` |
| `app.oyun.co.in` | main customer application: home, turf list, sports, profile, saved, bookings list, matches, tournaments | turf pages go to `book.`, guides and FAQs to `help.` |
| `book.oyun.co.in` | booking interface: a turf's page (slot picker, checkout), tickets (`/bookings/<id>`), player sign-in | everything else goes to `app.` |
| `help.oyun.co.in` | booking guides and FAQs: `/help`, `/faq`, `/guides`, `/privacy`, `/terms` | `/` goes to `/help`; public even before launch |
| `partner.oyun.co.in` | turf owner dashboard | `/` goes to `/partner`; other paths go to `app.` |
| `admin.oyun.co.in` | OYUN admin dashboard | `/` goes to `/admin`; other paths go to `app.` |

`app.`, `book.` and `help.` are permanent (301) redirects to the same path on `www` (query string kept). Launch-gate redirects stay 307.

## Setup (once)
1. Vercel project: add `app.`, `book.`, `help.`, `partner.` and `admin.oyun.co.in` as domains.
2. GoDaddy DNS: a CNAME for each of `app`, `book`, `help`, `partner`, `admin` to the same target as `www`.
3. Set `NEXT_PUBLIC_SITE_URL=https://www.oyun.co.in` in Vercel. `www` is the single canonical host for SEO.
4. Clerk: the production instance must allow `app.oyun.co.in` (same root domain as the instance).

At launch the landing page `/` can stop rewriting to `/welcome`: change `landing` in `routeForHost`.

## Launch gate
The booking site was **opened to the public on 22 October 2026** (`LAUNCH_AT` in `src/lib/hosts.ts`; the plan was 31 October). While `LAUNCH_AT` is in the future the booking site is closed to the public, on `app.oyun.co.in` and on the `*.vercel.app` address. `help.` stays public. Visitors to a closed page go to the countdown page on `www.oyun.co.in/countdown`, so the Browse & book button always lands on something that explains why. Dashboards (`partner.`, `admin.`, and `/partner` `/admin` on any host) and `/api/*` stay reachable.

- **Opens by itself** at the launch time. After it, `www.oyun.co.in` also serves the real site (the landing page stops showing).
- **Open early:** set `LAUNCH_OPEN=true` in Vercel.
- **Team preview before launch:** set `LAUNCH_PREVIEW_KEY` (16+ random characters) in Vercel, then open any page once with `?preview=<key>` (e.g. `https://app.oyun.co.in/?preview=<key>`). That sets a 30-day cookie on that host; `www` still shows the landing page. The key is dropped from the URL after it is read.
- Code: `isLaunched`, `previewAllowed` and `routeForHost` in `src/lib/hosts.ts`; the cookie is set in `src/proxy.ts`.

## Landing page
Code: `src/app/(launch)/landing` (page, `SlotBoard`, CSS module, fonts), shared header and footer in `src/app/(launch)/_ui` (also used by `/countdown` and `/about`). Display type is Barlow Condensed, text is Barlow. Colour carries meaning: green is an open slot, red a booked one. The hero board and the owner calendar are labelled illustrations, not live data. Scroll reveals are in `_ui/Reveal.tsx`; every animation is off with `prefers-reduced-motion`.
