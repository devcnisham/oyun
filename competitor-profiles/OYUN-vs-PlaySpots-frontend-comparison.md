# OYUN vs PlaySpots — frontend comparison and gap list

**Reviewed:** 31 October 2026  
**Scope:** public desktop/mobile journeys, customer-facing screens and public owner-product pages. OYUN observations include the current local frontend; some local changes are not deployed yet.  
**Purpose:** identify useful improvements for OYUN, not reproduce PlaySpots’ design or claim that every advertised feature has been independently verified.

## 1. What was reviewed

| Journey | PlaySpots evidence | Review boundary |
| --- | --- | --- |
| Public home and navigation | [Home](https://www.playspots.in/) | Mobile page, navigation, promotions, discovery and product entry points. |
| Location selection | [Booking application](https://book.playspots.in/) | Location permission denied, manual state/city picker, Karnataka results and empty-location recovery. |
| Local discovery | [Mangalore directory](https://www.playspots.in/sports-venues/mangalore/) | Venue links, location directory and booking handoff. |
| Venue information | [Perfect Pass](https://www.playspots.in/booking-spot/perfect-pass-kudroli-kodailbail-mangalore/) | Public venue identity, sport format and facilities. |
| Live booking interface | [TIMEOUT TURF](https://book.playspots.in/venues/timeout-turf-opp-satya-dharma-temple-mangalore) | Date range, sport selection, availability timeline, slot buttons, address, directions and operating hours. |
| Owner acquisition | [Partner page](https://www.playspots.in/partnership-form/) | Benefits, onboarding steps, contact options and application form. No form submitted. |
| Venue-management product | [Management app](https://www.playspots.in/sports-turf-management-app/) | Public feature explanations and demo CTA; private dashboard not inspected. |
| Academy product | [Membership management](https://www.playspots.in/membership-management-software/) | Public product positioning and feature descriptions; actual academy operation not tested. |
| Company/community | [About](https://www.playspots.in/playspots-about-us/), [News](https://www.playspots.in/news-and-events/), [Blog](https://www.playspots.in/playspots-blog/) | Public content and navigation. |
| Cancellation information | [Refund policy](https://www.playspots.in/refund-policy/) | Public policy presentation and support instructions. |

No account was created, OTP requested, form submitted, slot held, reservation made or payment attempted on PlaySpots. Its authenticated checkout, successful payment, refund execution and private owner/admin dashboards are **not verified**. The FAQ URL returned a browser-verification page through the research fetch, so its contents are not included as confirmed evidence.

Browser captures and source text are saved in [raw/playspots/2026-10-31](raw/playspots/2026-10-31/).

## 2. OYUN already has these — they are not missing

- Venue search, sport filters, sorting, city/area discovery routes and Google Maps views.
- Venue cards, prices, opening hours, facilities, descriptions, directions and contact details.
- Date selection, pitch selection, availability, slot selection and checkout.
- A choice between 30% advance and full payment in the interface.
- Clearly labelled online-payment **previews**, alongside the existing pay-at-venue reservation flow.
- Booking tickets, QR download, invoices, booking history and cancellation-related screens.
- Saved venues and a customer profile.
- A wallet display and existing reward/referral capabilities in the wider application; their visibility and activation depend on configuration.
- Venue ratings/reviews when genuine review data exists.
- Blog/guides, news/events, tournaments and community entry points.
- Advertising components, promotional/deal layouts and clearly labelled demo event cards.
- A venue-owner application page, partner dashboard and admin interface.
- A first-user guide, loading/confirmation animations and responsive navigation.

The main gap is the completeness, clarity and discoverability of these experiences. It is not a need to add another search, map, blog or booking system.

## 3. Prioritized customer-frontend gap list

**P1:** improve the core journey first. **P2:** improve discovery, trust and retention. **P3:** consider after demand/data is proven.

| # | Area | Current OYUN position | Improvement to consider | Priority / dependency |
| --- | --- | --- | --- | --- |
| 1 | Location discovery | Mangalore-focused search and Nearest sorting already exist. | Add an optional, compact manual nearby-area picker and useful suggestions, without forcing location permission. Keep Mangalore as the default. | P1 · Frontend using existing locations. |
| 2 | Location denial | Location features should remain usable without permission. | Make denial recovery explicit: retain manual search and filters, with a retry action only when requested. | P1 · Frontend. |
| 3 | Search suggestions | Search is available; matching places are not surfaced as a dedicated suggestion experience. | Offer venue/sport/area suggestions and clear query/reset states. | P1 · Frontend; data quality matters. |
| 4 | Availability scanning | OYUN has a slot grid. PlaySpots also presents a daily timeline on the inspected venue. | Add a compact day overview so players can scan available periods before reading individual slots. Keep the existing selection underneath. | P1 · Frontend using current availability. |
| 5 | Booking horizon | OYUN currently exposes seven days. The inspected PlaySpots venue exposes up to thirty. | Consider a longer calendar only if OYUN’s booking policy and availability support it. | P2 · Backend/business-rule decision first. |
| 6 | Slot duration | The inspected PlaySpots venue exposes half-hour starts. | Assess demand for shorter increments or flexible durations. Do not show unsupported choices in OYUN. | P3 · Backend/pricing dependency. |
| 7 | Venue quick facts | Information is split between the heading, booking section and lower details. | Present a compact, consistent summary: sport, format, hours, facilities and directions. | P1 · Frontend; do not invent facilities. |
| 8 | Venue address | Cards intentionally show Mangalore; maps and venue information already exist. | Make the full address easier to find inside venue details/directions, while keeping cards city-only as requested. | P1 · Frontend/content. |
| 9 | Venue photography | Several OYUN venues reuse a small set of photos. | Obtain distinct, authentic venue images; show a consistent gallery and deliberate crops. | P1 · Real image assets required. |
| 10 | Cancellation clarity | Rules exist in OYUN’s terms; they are not prominent in the inspected venue/checkout UI. | Add a short, expandable policy summary near confirmation, linking to OYUN’s own terms. | P1 · Frontend using approved policy. |
| 11 | Booking support | Venue contact and general support already exist. | Make the correct contact action obvious from a booking ticket, including cancellation/support context. | P1 · Frontend placement. |
| 12 | Payment readiness | UPI/card/bank screens are explicitly previews. | Maintain an unmistakable test state and clear reservation status. Do not present an online payment as successful. | P1 · Frontend clarity; real processing needs backend work. |
| 13 | Genuine trust signals | OYUN supports real ratings and verification data. PlaySpots displays a recent-booking count on the inspected venue. | Use verified ratings, review counts and approved venue badges consistently. Recent-booking statistics are optional and require real data. | P2 · Existing fields first; new statistics need backend data. |
| 14 | Offer discovery | OYUN has deal cards and offer routes. PlaySpots gives first-booking offers prominent placement. | When an actual campaign is active, show its value, conditions and eligible venues clearly. | P2 · Frontend using configured campaigns. |
| 15 | Rewards/referrals | Wallet exists; referral benefits are harder to discover from Profile. | Expose a rewards/referral entry point only when those programmes are enabled, with a clear explanation of eligibility. | P2 · Frontend; verify available data/actions. |
| 16 | Useful empty states | OYUN has basic empty states. The inspected booking app offers location change and venue suggestion recovery. | Suggest resetting filters, changing date or trying a nearby venue; add a venue-request CTA only if there is a real receiving workflow. | P2 · Mostly frontend. |
| 17 | Community discovery | Matches, tournaments and events already have routes/components. | Give genuine upcoming activities a clear path from Home and Profile. Keep demo items explicitly labelled until replaced. | P2 · Real event data required. |
| 18 | Blog usefulness | Blog and guides already exist. | Add original Mangalore venue/sport guides, related-venue links and a clear booking CTA within useful articles. | P2 · Editorial/frontend. |
| 19 | News/events credibility | Current event previews include approved demo content. | Replace demos with dated, real events and organizers when available. Avoid presenting samples as active registrations. | P2 · Content/workflow dependency. |
| 20 | First-visit experience | OYUN has a skippable guide. | Keep it brief, remembered and stable; avoid forcing a location/login modal before public browsing. | P1 · Frontend. |
| 21 | App/install discovery | OYUN has service-worker/PWA support. | Consider a contextual install/help entry if installability is verified. Show native-store badges only if actual apps are published. | P3 · Frontend plus release readiness. |
| 22 | Mobile motion | Card rows and autoplay components exist. | Keep card dimensions fixed during swipes, stop autoplay after user interaction, avoid hover lifts on phones and retain keyboard/reduced-motion support. | P1 · Frontend; local fixes implemented. |

The location, booking-window and half-hour observations above come from the public booking interface, not from assumptions about PlaySpots’ private backend. PlaySpots’ separate [location directory](https://www.playspots.in/best-turf-near-me/) also provides crawlable place links; OYUN already has area/sport pages, so this is an opportunity to improve linking, not a missing architecture.

## 4. Owner-facing gaps and opportunities

PlaySpots publicly describes operational capabilities in greater depth on its [venue-management page](https://www.playspots.in/sports-turf-management-app/). These are advertised capabilities, not independently tested dashboard features.

| # | Area | OYUN position | Recommended treatment | Scope |
| --- | --- | --- | --- | --- |
| 23 | Product explanation | OYUN’s owner page now has a hero, calendar illustration, benefits, steps and application form. | Add focused examples of actual calendar, booking, check-in and reporting screens. Label illustrative previews. | P2 · Frontend/content. |
| 24 | Trust and proof | OYUN should not borrow competitor reach or revenue claims. | Add genuine owner testimonials or case studies only with permission and verified facts. | P2 · Real evidence required. |
| 25 | Demo/contact journey | Application is available; a dedicated demo journey is less developed. | Consider a secondary demo/contact CTA connected to a real inbox or scheduling workflow. | P2 · Frontend plus receiving workflow. |
| 26 | Operational feature visibility | Calendar/check-in/dashboard features exist in OYUN. | Clearly explain supported owner capabilities instead of promising every feature advertised elsewhere. | P1 · Frontend copy audit. |
| 27 | Advanced manager tools | PlaySpots markets bulk booking, communications, financial reporting and multi-venue operation. | Audit OYUN’s actual owner capabilities before deciding which gaps are real. Add frontend navigation only for working features. | P3 · Separate authenticated product/backend audit. |
| 28 | Academy memberships | PlaySpots has a dedicated [academy product](https://www.playspots.in/membership-management-software/) describing members/plans, attendance, coaches and fee collection. | Treat academy management as a separate product decision, not an extra landing-page section claiming support. | P3 · Backend and operational scope. |

## 5. Things to learn from PlaySpots without copying them

1. Put the next useful action close to the relevant information: find a venue, scan a date, see directions, or contact support.
2. Make genuine promotions understandable at a glance.
3. Explain owner benefits with product examples and a clear application journey.
4. Keep content pages connected to relevant venues and sports.
5. Present refund/cancellation information as a findable part of the journey. Use [PlaySpots’ refund page](https://www.playspots.in/refund-policy/) as a presentation reference, **not as OYUN’s policy**.

## 6. Things OYUN should not copy

- A multi-state picker before there is real inventory outside Mangalore.
- Mandatory geolocation for public browsing. Manual selection must work.
- Reach statistics, reviews, recent-booking counts, discounts or testimonials that OYUN cannot substantiate.
- Competitor cancellation fees, refund times or booking rules.
- Native-app badges without a published app.
- Membership, coaching, messaging or reporting interfaces that imply an unimplemented service.
- Excessive auto-rotation, mobile hover scaling or moving cards that interrupt swiping.
- More cards simply to match a competitor’s page length.

The inspected public location flow had confusing naming/results in one Karnataka selection and an empty result for another selection. That is a reason to keep OYUN’s location model simple; it is not proof that all PlaySpots location results are broken. Public marketing counts also vary between its pages, so they should be treated as company claims rather than independently verified totals. Some news items are old; having a News page alone is not a substitute for maintained content.

## 7. Recommended implementation order

| Phase | Work | Completion condition |
| --- | --- | --- |
| A — Stability | Finish all-card swipe stability, numeric slot refresh, Map navigation and wordmark consistency. | No geometry shift mid-swipe; user interaction pauses autoplay; Map hides bottom tabs; count stays numeric; OYUN wordmarks use Kanit 700 italic. |
| B — Venue decision | Improve quick facts, authentic photos, address/directions and cancellation/support placement. | A player can understand the venue and booking conditions without hunting through unrelated pages. |
| C — Discovery | Add useful search suggestions, optional nearby-area selection and stronger empty states. | Works with location permission denied and preserves active filters. |
| D — Trust/retention | Surface enabled rewards, real offers, genuine reviews and actual events. | Every claim and actionable CTA has real data and a working destination. |
| E — Owner story | Add verified screenshots, product explanations and a real demo/contact path. | Every advertised capability is supported by OYUN. |
| Later | Longer horizon, flexible duration, real payments and academy/advanced management work. | Separate backend/business approval and implementation; outside this frontend-only session. |

## 8. Frontend work already implemented locally in this session

- Map removed from bottom tabs and placed inside the mobile Venues search bar; icon remains black.
- Bottom tabs hidden in Map view and restored in list view.
- Map uses the freed mobile viewport space.
- Slot banner uses the available count immediately, animating numeric updates rather than showing a loading sentence.
- Card snapping/geometry stabilized; mobile hover/drag effects removed where relevant.
- Shared autoplay rails and ads pause immediately on touch, pointer, wheel or focus interaction.
- OYUN wordmarks changed to **Kanit Bold Italic — weight 700, italic**, including the loader, customer branding, ads, footer, invoice and dashboard branding.

These are local frontend changes, not a claim of deployment. Verification completed so far: TypeScript and lint passed; 651 unit tests passed; 10 targeted browser checks passed with 2 device-specific skips. No backend functionality was added for this comparison.

## 9. Evidence and limitations

- Public browser captures: [raw/playspots/2026-10-31](raw/playspots/2026-10-31/).
- OYUN source inspected: `HomeView`, `BookingHome`, `LiveSlots`, `VenueSearchBar`, `ArenasClient`, `TurfDetail`, `BookingFlow`, `CheckoutSheet`, `PaymentPreview`, `ProfileScreen`, `CommunityCards`, owner landing and terms.
- OYUN’s seven-day window is declared in `src/modules/shared/lib/time.ts`.
- Customer account data, rewards activation, private dashboards and transaction processing were not compared through real accounts.
- Public marketing descriptions establish what PlaySpots advertises; they do not establish that every operation was tested.
- This is a frontend gap review, not a security, legal, payment-compliance or market-share audit.
