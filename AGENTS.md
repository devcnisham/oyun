<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SEO rules for agents

- Every public page needs a real title, description and canonical. Use `ogBase(path)` from `src/modules/web/lib/seo.ts` whenever a page sets `openGraph` (Next.js replaces that object, it does not merge).
- Public pages live on `www.oyun.co.in` only; `app.`, `book.` and `help.` are 301s (see `src/modules/shared/backend/hosts.ts`).
- Keep `src/app/sitemap.ts` and `src/app/robots.ts` current when routes change. No private routes in the sitemap. Test and demo venues stay out (`isIndexableTurf`).
- Never use robots.txt or `noindex` instead of authentication.
- Use semantic HTML, real headings and crawlable links. No placeholder or fabricated content.
- Structured data must match visible content. Never fabricate reviews, ratings or prices.
- Do not expose private data (owner, commission, phone of players) in metadata or schema.
- Test metadata, sitemap, robots, status codes and canonicals; never say a check passed unless it was run.
- Update `docs/SEO-KEYWORDS.md` when route structure changes.
