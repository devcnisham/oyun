# Contributing

## Set up

```bash
npm install     # also installs the pre-commit hook (type-check and lint)
npm run dev
```

Read `AGENTS.md` and `docs/NEXT16-NOTES.md` first: this Next.js version differs from older ones.

## Working agreement

- One branch per task, named with the Jira key and a short name, such as `OYUN-67-race-test`, `fix/OYUN-80-mask-phone` or `feature/OYUN-67-race-test`. Branch types and the `staging` branch are in `docs/BRANCHING.md`. Open a pull request into `main`, with the Jira key at the start of the title (`OYUN-67 Double-booking race test`); `main` is what Vercel deploys.
- Keep pull requests small and about one thing. Say what changed, why, how it was tested and any follow-ups (the PR template asks).
- **Done means:** it works locally, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass, a test exists for any new rule, and `docs/build-tracker.html` and `docs/TASK-WORKFLOW.md` are updated.
- CI runs lint (zero warnings), type-check, `npm audit` for production dependencies, unit tests, build, the SQL tests on Postgres 17 and Playwright. Merge only when every check is green.
- Changes to sign-in, money, or production data wait for the owner's review.
- Never commit secrets or `.env.local`. Never run SQL against production from a script.

## Tests

| What | How |
| --- | --- |
| Rules in `src/lib` | `npm test` (Vitest) |
| Database functions, constraints, double-booking race | `npm run test:sql` (needs Postgres; CI runs it) |
| Browse, hold, book, cancel, check-in, approve a turf | `npm run test:e2e` (Playwright; starts its own dev server) |

If you add a server action, add it to the table in `src/lib/authorization.test.ts` with the permission it needs.

## Tracker

`docs/build-tracker.html` is the record of tasks, risks, features and checklists. After a merge update it (`node scripts/check-tracker.mjs` must pass), then regenerate the Jira file with `node scripts/export-jira.mjs` if you use Jira (`docs/JIRA.md`). `docs/TASK-WORKFLOW.md` is the ordered queue.
