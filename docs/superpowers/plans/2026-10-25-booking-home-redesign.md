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
