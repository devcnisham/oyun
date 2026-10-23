# Defect log

Every defect found while building goes here, including ones introduced and fixed in the same session. Newest first. Format: what happened, how it was found, the fix, what now prevents it.

## 2026-10-22

- **Service worker served the home page for any failed request.** The offline fallback returned the cached `/` HTML for every failed GET, so an offline `/api/*` call got HTML instead of an error, and cross-origin requests (Clerk, analytics) were intercepted too. Found in a mobile-web audit reading `public/sw.js`. Fixed: only same-origin requests are handled and only page navigations fall back to `/`; other failures return a network error. Prevention: `src/test/cross-cutting/service-worker.test.ts` runs the worker in a stubbed context.
- **Checkout, list-turf, matches and tournaments forms made iOS Safari zoom on focus.** Inputs were 13 to 15px; Safari zooms the page when a field under 16px is focused and does not zoom back. Found by a mobile forms audit. Fixed: inputs are 16px and 44px tall. Prevention: `src/test/cross-cutting/mobile-forms.test.ts`.
- **Checkout phone field was not a tel field and had no name.** It used `autoComplete="tel"` (expects +91 prefix) for a 10-digit number, was not `type="tel"`, and the name, phone and promo fields had only placeholders, so screen readers had no label. Found by the audit. Fixed: `type="tel"`, `autoComplete="tel-national"`, aria-labels, promo code `autoCapitalize="characters"` and `autoComplete="off"`. Prevention: same test.
- **Matches host form labels were not tied to their fields.** Eight `<label>`s had no `htmlFor`, so tapping a label did nothing and screen readers read the fields unnamed. Fixed with ids. Prevention: same test.
- **Matches and tournament join/register forms had no name or phone hints and buttons under 44px.** Phone fields lacked `inputMode="numeric"` and `autoComplete`, name fields lacked `autoComplete`, buttons were about 34px tall. Fixed: hints added, `minHeight: 44` on every button. Prevention: same test.
- **List-turf WhatsApp field showed a full keyboard.** Missing `inputMode="numeric"` and `autoComplete`. Fixed. Prevention: same test.

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
