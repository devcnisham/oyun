# Defect log

Every defect found while building goes here, including ones introduced and fixed in the same session. Newest first. Format: what happened, how it was found, the fix, what now prevents it.

## 2026-10-17

- **Cached pages blocked their own scripts.** `/arenas`, turf, sport and area pages were cached by the CDN but still sent the per-request nonce policy, so the browser blocked Next's inline scripts and the turf page never loaded its slots. No build, test or CI check failed. Found by loading the live page and reading the console. Fixed in #357 (cached routes get the build-time policy). Prevention: the post-deploy check now confirms the cache headers; a test that asserts the policy per route is still missing.
- **Phone home page hydration error (React #418).** The phone home page is built at `/m` but shown at `/`, so the top bar and bottom nav rendered differently on server and client. Found by Lighthouse's console check, reproduced with a Clerk-key build at phone size. Fixed in #356 (treat `/m` as home).
- **Phone home page lost 20 SEO points.** `/m` was marked noindex. Found by the Lighthouse check. Fixed in #356.

## 2026-10-16

- **Every page rendered per request.** The root layout read the request nonce through `headers()` (added in #355 to fix the Clerk script block), which made all pages dynamic and uncacheable. Found by building with a Clerk key and reading the route table. Fixed in #356 (no read in the layout; `strict-dynamic` dropped so Clerk's loader is allowed by host).
- **Clerk scripts blocked by the security policy.** `strict-dynamic` ignored the host list, so Clerk's loader had no nonce. Found by reading the live console. Fixed in #355, then reworked in #356.
- **Top bar search overlapped the wordmark on narrow desktops.** A 460px minimum width beat the maximum. Found in code review. Fixed in #354.
- **Hidden top bar stayed focusable.** `opacity: 0` does not remove it from the tab order. Found in code review. Fixed in #354, then the hide behaviour was removed in #359.
- **Activity logging could break the action it recorded.** The logger read `ctx.partner.id` and threw when a context had no partner. Found when the check-in tests failed. Fixed in #354 by fixing the test context and keeping the logger strict.
- **Activity log cap was shared across all venues.** One busy venue could erase others' history. Found in code review. Fixed in #354 (cap per partner).
