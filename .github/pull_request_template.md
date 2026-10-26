<!-- Start the PR title with the Jira key(s), e.g. "OYUN-67 Double-booking race test". See docs/BRANCHING.md. -->

## What changed

## Why

## How it was tested
<!-- commands and results; for UI, what you clicked -->

## Security and data
<!-- who can call this, what data it touches, any new secret or permission. Write "none" if none. -->

## Follow-ups and things the owner must do
<!-- env vars, SQL to run on production, dashboards -->

- [ ] Followed [docs/FEATURE-WORKFLOW.md](../docs/FEATURE-WORKFLOW.md): steps 01 to 05 settled first, test written before the code, any defect logged in `docs/BUGS.md`
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` pass
- [ ] Tests added for new rules (and for any new server action: `src/test/cross-cutting/authorization.test.ts`)
- [ ] `docs/build-tracker.html` updated and `node scripts/check-tracker.mjs` passes
