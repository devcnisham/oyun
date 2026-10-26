# Booking home redesign implementation plan

Goal: implement the approved booking-first home using the existing OYUN design tokens.
Architecture: server-rendered home composes search, venue, deal and sponsor components. Public venue summaries and validated happy-hour offers feed the UI; existing booking routes handle transactions.
Tech stack: Next.js App Router, React, CSS Modules, Vitest, Playwright.

## Constraints
Use real public data only. Preserve booking and authentication. Keep `/m` compatible. Preview for visual review before production deployment.

## Tasks
- [x] Add `src/modules/web/lib/home-deals.ts` and tests for active daytime happy-hour selection. Reject invalid percentages, invalid hour ranges and missing venues. Preserve full applicable hours and avoid claiming a fixed discounted price.
- [x] Add `_booking/BookingSearch.tsx`: native GET form targeting `/arenas` with `q`, `sport`, `date`, using seven-day IST date bounds.
- [x] Add `_booking/VenueCard.tsx`: public venue image, real featured badge, review-backed rating, availableToday, area, price and crawlable booking link.
- [x] Add `_booking/BookingHome.tsx` and stylesheet: compact red typography, four-column venue grid, three-column daytime deals, real sponsored ads, owner link and mobile breakpoints.
- [x] Replace HomeView composition, removing home popup and old feed. Adapt home navbar with light treatment and direct navigation while preserving Clerk account logic.
- [x] Update browser tests to cover search query/date/sport propagation, direct venue navigation, no horizontal overflow and responsive layouts. Run booking regressions, type checking, lint and metadata checks.
- [x] Inspect desktop/mobile screenshots, correct defects and open local preview. Do not deploy before visual review.

## Verification recorded 26 October 2026
- 637 unit tests passed across 81 files.
- Desktop/mobile search, direct booking, confirmation and cancellation passed.
- Tablet layout, no horizontal overflow, home metadata, sitemap/robots and axe home checks passed.
- Type checking and focused ESLint checks passed.
- Browser tests ran from an independent temporary copy to preserve the existing port-3000 development server.
- No active happy-hour offers or sponsor ads are present in preview seed data; the validated sections render when configured.
- Production remains at the previous released version pending visual review of this redesign.

## Expanded scope approved 26 October 2026
- Every customer, partner and admin page receives the same OYUN visual system through shared shells and dedicated templates.
- Fixed flush top navigation; remove redundant header search and floating outer pills.
- Remove hero tagline/location row. Use Mangalore-only generic card locations, preserving actual addresses/SEO routes.
- Align card CTA/footer sizing while keeping venue name/city tightly spaced. Sport categories only on venue results. Incoming URL search preferences remain clearable.
- List your turf is a button; clean circular logo; Support stays in the desktop footer row; oversized dimmed OYUN footer wordmark.
- Add reduced-motion-safe entrances, stagger and hover/press interaction.
- Preserve data/auth/business logic; verify private dashboards in the isolated development test environment.

## Final verification
- 99 browser tests passed, 11 conditional/context-specific skips; no failed browser tests.
- All 638 unit tests passed across 81 files.
- Typecheck, changed-TypeScript ESLint, changed-CSS parsing and git diff whitespace checks passed.
- Full browser coverage includes booking/cancel/reschedule display, owner approval, partner calendar/export, public-page metadata/crawler endpoints, accessibility and responsive overflow/card geometry.
- Development-only HMR hash mismatch was resolved by a clean isolated build cache and warming launch routes.
- Production has not been replaced by this redesign; the local preview is available for review.
