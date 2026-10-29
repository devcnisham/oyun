# OYUN welcome implementation plan
Goal: implement the approved landing, loading and booking motion plus first-user guide.
Architecture: small CSS motion components, existing Suspense boundaries and real checkout pending state; browser-local guide preference. No booking backend changes.
Tech: Next.js App Router, React, CSS modules.
- [x] Add reusable OYUN loading wordmark and confirmed check animation with reduced-motion support.
- [x] Connect existing page skeletons, checkout pending and confirmed ticket states.
- [x] Add skippable and replayable three-step Home guide with accessible dialog focus.
- [x] Replace /landing with responsive brand-led page, real venue links and booking steps; correct host routing, sitemap and canonical.
- [x] Run typecheck, lint, meaningful guide/state tests and local route/metadata checks.

Validation: typecheck, ESLint, Knip, 646 unit tests and 8 desktop/mobile welcome browser tests passed. Inspected owner-page mobile/desktop and landing screenshots. Full-refresh splash tested twice per viewport. Local /list-turf responds 200.

Additional regression checks: 8 desktop/mobile booking and owner-approval tests passed. The completed centred OYUN frame was visually inspected. Local canonical resolves to the configured localhost origin with /landing; sitemap includes /landing and robots exposes the sitemap.
