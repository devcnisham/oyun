# Next.js 16 notes for OYUN

Read from `node_modules/next/dist/docs/` (Next 16.3.8, React 19.2.8) on 9 Oct 2026. AGENTS.md says this Next.js differs from older versions, so check the guide named in each line before changing code in that area. Paths below are inside `node_modules/next/dist/docs/01-app/`.

## What the app already does right

| Rule in Next 16 | Where OYUN follows it | Guide |
| --- | --- | --- |
| `middleware.ts` is deprecated; use `proxy.ts`, runs on Node.js only, `edge` is not supported | `src/proxy.ts` | `02-guides/upgrading/version-16.md` (middleware to proxy) |
| `params`, `searchParams`, `cookies()`, `headers()` are async; `await` them | all pages use `await params` | same guide (Async Request APIs) |
| In `opengraph-image`, `twitter-image`, `icon`, `apple-icon` the props `params` and `id` are Promises | `src/app/opengraph-image.tsx`, `twitter-image.tsx` | same guide (Async parameters for icon) |
| `connection()` from `next/server` marks a render as request-time | `src/app/(main)/layout.tsx` | `03-api-reference/04-functions/connection.md` |
| `after()` runs work after the response is sent | `src/lib/store.ts` (slot broadcast after a write) | `03-api-reference/04-functions/after.md` |
| Turbopack is the default for `next dev` and `next build`; a custom `webpack` config fails the build | `next.config.ts` has none | upgrading guide (Turbopack by default) |
| ESLint uses a flat config and `next lint` is gone; run `eslint` directly | `npm run lint` is `eslint` | upgrading guide (ESLint Flat Config) |

## Rules to apply in the next tasks

- **Server actions are POST requests to the page route.** A proxy `matcher` that excludes a path also skips server action calls on that path (`03-api-reference/03-file-conventions/proxy.md`, Execution order). Do not narrow the matcher in `src/proxy.ts` without checking the cookie guard and HTTPS redirect still cover action calls. The current matcher already skips static files and images and covers `/api`, `/trpc` and `/__clerk`; keep it that way.
- **`revalidatePath(path, type)`**: a dynamic pattern such as `/turfs/[area]` needs `type` (`'page'` or `'layout'`); a literal path must omit it. Do not append `/page`. In a route handler it only marks the path stale, it does not re-render (`03-api-reference/04-functions/revalidatePath.md`). OYUN calls `revalidatePath('/', 'layout')` after every write, which invalidates the whole site; this matters for task P10-03 (ISR).
- **`revalidateTag(tag, profile)` now needs a second argument**, for example `revalidateTag('posts', 'max')`. The one-argument form is a TypeScript error. For immediate expiry inside a server action use `updateTag` (upgrading guide, Caching APIs). Use tags, not paths, when P10-03 adds cached public pages.
- **CSP nonces (task P9-13).** The nonce is made in the proxy per request, put into the `Content-Security-Policy` header and an `x-nonce` request header; Next.js reads `'nonce-...'` from the header and applies it to its own inline scripts and `<Script nonce>`. It only works on **dynamically rendered** pages, because static pages are built without request headers. The current CSP in `next.config.ts` uses `'unsafe-inline'` for scripts; moving it to the proxy with a nonce and `'strict-dynamic'` means every page that must carry the nonce has to render per request (`await connection()`), which cancels any static caching of those pages. Decide per route: marketing pages that need ISR versus pages that need the strict CSP. Guide: `02-guides/content-security-policy.md`. The proxy matcher should skip `/api`, `_next/static`, `_next/image`, `favicon.ico` and prefetch requests.
- **Sitemap with `generateSitemaps`**: `id` is a Promise (upgrading guide, Async `id` for sitemap).
- **`loading.tsx`** gives an instant loading state per route segment (`03-api-reference/03-file-conventions/loading.md`); task P10-05 adds it. **`error.tsx`** is a client component and must have its own reset button (`03-api-reference/03-file-conventions/error.md`).
- **`next/image` changes** in 16 (default `minimumCacheTTL`, `qualities`, local image rules, remote patterns): re-read the images section of the upgrading guide before touching `images` in `next.config.ts` (task P10-09).

## Not in use here, so not read in depth

Cache Components and `use cache`, PPR, the React Compiler, parallel routes, `instrumentation.ts`. If a task needs one, read its guide first: `02-guides/migrating-to-cache-components.md`, `03-api-reference/01-directives/use-cache.md`, `02-guides/instrumentation.md`.

## How to check changes

`npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. Run `npx next typegen` if the `PageProps` or `LayoutProps` helper types are used and look stale.
