# Local and live preview

Run `npm run dev` from this repository and use http://localhost:3000. The port is explicit: an occupied port fails instead of silently moving edits to 3001. `npm run dev:lan` exposes that same preview to a phone on your Wi-Fi using your computer's IP address.

Home and the mobile /m rewrite render the same HomeView. Responsive styles use CSS viewport width; compare at the same device width and browser zoom. The phone bottom bar and booking action bar share --bottom-nav-h, including the safe-area inset. Next's development indicator is hidden; runtime errors still appear normally. Local OYUN offline workers and caches are removed in development so stale production-preview assets cannot mask changes.

Unpublished edits appear locally first. They will differ from live until that exact source is deployed. The currently deployed baseline on 28 October 2026 is 0e8476a (production deployment dpl_AcFZzLGXqM98fZq7ozPJ4J8jSbAa).

Local .env.local currently has no Clerk/Supabase credentials, so local sign-in and bookings use isolated device/local-file data. Counts, account avatars and availability can differ from production. Do not copy production database credentials to fix visual parity. Configure separate Clerk development and Supabase development instances when testing those integrations.
