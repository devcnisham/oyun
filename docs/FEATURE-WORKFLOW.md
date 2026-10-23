# Feature workflow: 18 steps, in order

Every feature, small or large, passes through these steps. It sits on top of [TASK-WORKFLOW.md](TASK-WORKFLOW.md) (the task queue), [BRANCHING.md](BRANCHING.md) and [DAILY-ROUTINE.md](DAILY-ROUTINE.md) (what runs on its own).

```
01 Requirement       what problem, for whom, why now
02 User flow         the path a person takes through it
03 UI/UX             screens, states: empty, loading, error
04 Database          tables, relations, RLS
05 Backend/API       server actions, route handlers
06 Business logic    the rules, isolated and testable
07 Frontend          components wired to the API
08 Validation        check input at every boundary
09 Error handling    failure paths, messages the user can see
10 Tests             Vitest unit/integration, Playwright e2e
11 Documentation     what it does, how to extend it
12 Integration       wired into the rest of the product
13 CI                passing in the pipeline
14 Preview           the change checked in a running copy
15 QA                walked by hand against the requirement
16 Deploy            in production (the daily noon deploy)
17 Monitor           errors and health visible
18 DONE
```

## Rules

1. **Steps 01 to 05 are settled before any component file is opened.** Write the requirement, flow, screens, data and API shape first (a few lines each in the PR description or an ADR in `docs/adr/`).
2. **Write the test before the code and watch it fail.** A test written afterwards passes immediately and only proves what you built, not what was required. The most serious defect in `BUGS.md` produced no error, no warning and no failing build; only a test that checks the control actually engaged would have caught it.
3. **Nothing is DONE** until tests, documentation and monitoring exist for it.
4. **Every defect found goes in [BUGS.md](BUGS.md)**, including ones introduced and fixed in the same session.
5. **Server actions** are added to `src/test/cross-cutting/authorization.test.ts`; partner and admin pages to `src/test/cross-cutting/authorization-audit.test.ts`.

## How the steps map onto this repo

| Step | Where it lives here |
|---|---|
| 01 to 03 | PR description "What changed" and "Why"; screens checked at desktop and 375px |
| 04 | `supabase/` SQL and `src/modules/shared/database/store.ts`, `seed.ts` (`migrate()`), `types.ts`; RLS checked by `npm run test:sql` |
| 05 | `src/modules/*/backend/*-actions.ts` (`'use server'`), `src/app/api/**/route.ts` |
| 06 | pure functions in `src/lib/` with a `*.test.ts` beside them |
| 07 | `src/app/**` and `src/components/**`, CSS Modules |
| 08, 09 | `ValidationError`, the form helpers in `src/modules/shared/backend/action-utils.ts`, error states in the UI. Zod is not installed; add it only as a deliberate decision. |
| 10 | `npm test`, `npm run test:e2e`, axe in `e2e/a11y.spec.ts` |
| 11 | `docs/`, the tracker (`docs/build-tracker.html`) |
| 13 | GitHub Actions `CI` (lint, types, tests, build, e2e, Lighthouse, SQL, secret scan) |
| 14 | Run `npm run build && npm start` locally, or the PR's preview if Git deploys are on |
| 16 | `Scheduled deploy` at 12:00 IST ([DEPLOY-SCHEDULE.md](DEPLOY-SCHEDULE.md)) |
| 17 | `Post-deploy check` at 13:00 IST, `/api/health`, `/api/monitoring/double-bookings`, on-call alerts |

## From idea to next feature

```
IDEA -> REQUIREMENTS -> PRD -> USER FLOWS -> ARCHITECTURE -> UI/UX -> DATABASE
-> BACKEND/API -> FRONTEND -> INTEGRATIONS -> GIT -> TESTING -> CI/CD -> PREVIEW
-> QA -> PRODUCTION READY -> DEPLOYMENT -> MONITORING -> RELEASE -> MAINTENANCE -> NEXT FEATURE
```
