# Home split hero implementation plan

Approved direction: compact headline on the left, white booking panel on the right, smaller sport categories below. Remove the star, court drawing and promotional aside. Preserve native GET search, date bounds, metadata and lower home sections.

- [x] Replace hero markup in BookingHome.tsx with a two-column introduction and BookingSearch panel.
- [x] Replace hero/search/category CSS with responsive scoped rules: paper #faf9f7, ink #222222, OYUN red #a40000, white #ffffff, border #e5dfdb. Keep existing display/body fonts. Stack at 760px, maintain 44px controls and visible keyboard focus.
- [x] Run typecheck, targeted ESLint and responsive browser inspection at desktop and mobile sizes. Verify form names and action remain unchanged.

Validation: TypeScript and targeted ESLint passed. Local browser inspection confirmed the updated compact layout and native search/date controls.

## Approved revision: booking-first home
Replace the split hero with “Where are we playing?”, a horizontal native GET search and four muted sport tiles. Keep search labels, date bounds, keyboard focus, reduced motion and existing lower sections. Stack the search on mobile and use two sport columns. Bring featured venues to 32px below the categories.
