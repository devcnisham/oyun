# SEO strategy: keywords, intents, KPIs, roadmap

Market: Mangalore only (launch 31 Oct 2026). Canonical host: `https://www.oyun.co.in`. Language: English now; Kannada and Hindi planned.

## Page to keyword map (one primary intent per page)
| Page | Primary keyword | Secondary / long tail |
|---|---|---|
| `/` | turf booking Mangalore | book turf online Mangalore, sports turf near me, turf booking app Mangalore |
| `/arenas` | turfs in Mangalore | compare turf prices Mangalore, cheap turf Mangalore, turf slots today |
| `/sports/football` | football turf Mangalore | 5 a side football Mangalore, futsal Mangalore, football turf price per hour Mangalore |
| `/sports/box-cricket` | box cricket Mangalore | box cricket turf near me, box cricket ground booking, box cricket rules |
| `/sports/badminton` | badminton court Mangalore | indoor badminton court booking Mangalore, badminton court price per hour |
| `/sports/pickleball` | pickleball Mangalore | pickleball court Mangalore, where to play pickleball in Mangalore |
| `/sports/padel` | padel Mangalore | padel court Mangalore (noindex until a venue exists) |
| `/turfs/<area>` | turf in `<area>` (Kodialbail, Kankanady, Ullal, Bejai, Kadri, Pandeshwar, Vamanjoor, Vidyanagara, Bikarnakatte) | football turf `<area>`, box cricket `<area>` |
| `/sports/<sport>/<area>` | `<sport>` `<area>` Mangalore | best `<sport>` turf in `<area>` |
| `/arenas/<id>` | `<venue name>` | `<venue>` booking, `<venue>` price, `<venue>` address |
| `/curated/night-turfs` | night turf Mangalore | turf open late night Mangalore, midnight football Mangalore |
| `/curated/monsoon-covered-turfs` | covered turf Mangalore | rain-proof turf Mangalore, monsoon football Mangalore |
| `/guides/*` | question keywords (rules, prices, shoes, beginners) | how much does a turf cost in Mangalore |
| `/list-turf` | list your turf | turf management software India, turf owner booking app |
| `/faq`, `/help` | how to book a turf online | turf cancellation policy, rain refund turf |

## KPIs (review weekly in Search Console and GA4)
1. Indexed pages vs sitemap pages (target 95%+ within 4 weeks of launch).
2. Impressions and clicks for the head terms above; average position per term.
3. Click-through rate on `/`, `/arenas`, sport and area pages.
4. Organic sessions to booking: holds and paid bookings from organic source.
5. Google Business Profile: views, calls, direction requests, bookings.
6. Core Web Vitals pass rate (LCP 2.5 s, INP 200 ms, CLS 0.1) at the 75th percentile.
7. Referring domains (local, relevant only).

## Roadmap
1. Foundation (done): single canonical host `www`, 301 from old subdomains, host-aware robots, clean sitemap.
2. On-page: keyword H1s, unique titles and descriptions, full Open Graph on every page, descriptive alt text.
3. Structured data: Organization, WebSite, SportsActivityLocation (geo, hours, price), Article, BreadcrumbList, ItemList.
4. Programmatic pages: `/areas` hub, price-band pages, format pages (5-a-side, 7-a-side). Each shows only when it has real venues.
5. Content: guides engine (topic clusters per sport), a monthly Mangalore turf price index built from real data.
6. Local and off-site: see `docs/SEO-OFFSITE.md` (done by the founder, not code).
7. Kannada and Hindi pages with hreflang after translations are reviewed by a native speaker.

## Competitors to review monthly
Playo, Hudle, local WhatsApp groups, Google Maps listings for "turf in Mangalore". Note which queries they rank for and which venue pages exist.

## Performance notes (lab, 21 Oct 2026, `next start`, Lighthouse 12.8.2 mobile)
| Page | Perf | A11y | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` (phone home) | 92 | 100 | 100 | 100 | 3.4 s | 50 ms | 0 |
| `/arenas` | 89 | 100 | 100 | 100 | 3.8 s | 40 ms | 0 |
| `/arenas/perfect-pass-kodialbail` | 93 | 100 | 100 | 100 | 3.3 s | 10 ms | 0 |

Lab numbers on a laptop with Lighthouse's slow-phone throttling; real-user data comes from Speed Insights and Search Console after launch.
Known gap: on `/arenas` the first card image is not in the initial HTML (the list renders on the client inside a Suspense boundary), so the browser finds it late. Fixing it means server-rendering the list; do it only with a test that filters still work.
