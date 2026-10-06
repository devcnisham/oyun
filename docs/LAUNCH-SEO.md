# Launch & SEO playbook

What the code already does, and the steps that need a person with access to Google, Vercel and the business.

## 1. Settings to add in Vercel (Project → Settings → Environment Variables)

| Variable | Why |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your real domain, e.g. `https://oyun.in`. Used for canonical URLs, sitemap, Open Graph. Must be set **before** building. |
| `GOOGLE_SITE_VERIFICATION` | The `content` value from Search Console's "HTML tag" method (see §2). |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID (`G-XXXXXXX`). Loads only after a visitor accepts cookies. |
| `ERROR_WEBHOOK_URL` | Optional Slack or Discord incoming webhook; you get a message for each new server or browser error. |
| Supabase / session / admin variables | See `.env.example`. |

Also in Vercel: enable **Web Analytics** and **Speed Insights** (Project → Analytics / Speed Insights). They start reporting real-user Core Web Vitals as soon as visitors accept cookies.

## 2. Google Search Console (get indexed)

1. Go to https://search.google.com/search-console and add a **URL-prefix** property for `https://your-domain`.
2. Choose **HTML tag**, copy only the `content="..."` value, set it as `GOOGLE_SITE_VERIFICATION` in Vercel and redeploy. Click **Verify**.
   (Better long term: also add a **Domain** property verified by DNS TXT record at your domain registrar.)
3. **Sitemaps** → submit `sitemap.xml`. It lists the home page, all turfs, the area pages (`/turfs/<area>`) and the info pages, and updates itself when turfs are added.
4. **URL Inspection** → request indexing for `/`, `/arenas` and each `/turfs/<area>` page.
5. After a week, check **Pages** (indexing errors) and **Enhancements** (FAQ, breadcrumbs, structured data). Fix anything flagged red.
6. Repeat with **Bing Webmaster Tools** (one click: "Import from Google Search Console").

## 3. Google Business Profile (biggest win for "turf near me")

Local searches are won on Maps, not just the website.

- Create a Google Business Profile for OYUN (category: *Sports booking agent* or *Sports club*), link the website.
- Encourage every partner turf to claim its own profile and set **"Book online"** / website link to its OYUN page `https://your-domain/arenas/<turf-id>`. Each one is a high-trust backlink and a booking channel.
- Ask happy players for Google reviews after check-in.

## 4. Backlink strategy (ranked by effort vs impact)

**Week 1–2: quick wins**
- Listings: Justdial, Sulekha, IndiaMART (for partners), Bing Places, Apple Maps, Facebook page, Instagram bio, LinkedIn company page. Same name, address and phone everywhere (NAP consistency).
- Partner turfs: give each owner a "Book on OYUN" badge/link for their website, Instagram link-in-bio and WhatsApp Business profile.

**Month 1: local authority**
- Mangalore city blogs, news sites and Instagram pages (e.g. city guides, "things to do in Mangalore" lists): pitch "Mangalore's turf map with live prices".
- College sports clubs (NITK Surathkal, St Aloysius, Manipal-Mangalore campuses): offer a student discount code; ask for a link on their club page.
- Corporate HR teams in Mangalore IT parks: offer team booking; ask for a link on their employee-perks page.
- Local football academies and tournaments: sponsor a small tournament in exchange for a link on the event page and posts.

**Ongoing: content that earns links**
- Publish a monthly "Turf prices in Mangalore" report from real booking data (average price by area, busiest hours). Journalists and bloggers link to data.
- Guides: "5-a-side vs 7-a-side", "Best turfs for night games in Mangalore", "How to organise a corporate football league". Link each guide to the relevant `/turfs/<area>` pages.
- Avoid paid link schemes and link farms; they risk a Google penalty.

## 5. What to measure

| Goal | Where | Target for month 1 |
|---|---|---|
| Indexed | Search Console → Pages | All sitemap URLs indexed |
| Ranked | Search Console → Performance → Queries | Top 10 for "football turf <area>" for each area page |
| Clicked | Search Console → Performance (CTR) | CTR above 3% on area pages; rewrite titles that underperform |
| Converted | GA4 / Vercel Analytics | Track Proceed → Pay → booking completed |
| Fast | Vercel Speed Insights | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on mobile |

## 6. Already done in the code

Sitemap and robots.txt, canonical URLs, titles and descriptions on every page, `noindex` on private pages, one H1 per page with ordered headings, image alt text, JSON-LD (Organization, WebSite search, SportsActivityLocation per turf, BreadcrumbList, ItemList, FAQPage), Open Graph/Twitter images, area landing pages with cross-links, custom 404, HTTPS enforcement + HSTS, compressed images served as AVIF/WebP, favicon/app icons, PWA manifest, cookie consent, privacy policy and terms, accessibility contrast (no WCAG AA violations on the main pages).
