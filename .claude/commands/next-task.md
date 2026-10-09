---
description: Do the next unfinished OYUN task end to end (branch, code, tests, PR, tracker), then stop at the gate
---

Run ONE task from the OYUN queue, then stop. Source of truth: `docs/MASTER-PROMPT.md` (rules, security rules, phase order) and `docs/TASK-WORKFLOW.md` (queue and gates). Optional argument: a task id to force (e.g. `/next-task R011`). Argument: $ARGUMENTS

## 1. Pick the task
- `git fetch -q && git checkout main && git pull --ff-only`, then `git log --oneline -30` and `gh pr list --state open`.
- Read `docs/TASK-WORKFLOW.md`. Take the first task in the queue that is not already merged. Check merged work by searching git log for the task id (R011, P8-04) and its title. If it is already done, tick it in the queue file and move to the next.
- If the task is marked GATE (needs production, keys, paid service, provider choice, deletion): do NOT start. Print exactly what the user must decide or do, mark it `BLOCKED` in the queue, and pick the next non-gated task.

## 2. Branch
- `git checkout -b claude/<short-task-name>` from fresh `main`. One task, one branch, one PR.
- If `node_modules` is missing, run `npm ci`. Read the relevant `node_modules/next/dist/docs/` guide before writing any Next.js code (AGENTS.md).

## 3. Plan, then build
- Write a 5 line plan: files, migration, tests, risks. Then implement the smallest change that finishes the task.
- Follow the security rules in MASTER-PROMPT.md: authenticate, authorize against the exact record, validate input, rate-limit, no secrets in code or logs, a test per authorization rule touched.
- Never touch production Supabase (`nimfjwxzolkwiyqmnaat`), Vercel or Clerk settings, or keys. SQL runs only on a local scratch Postgres.

## 4. Verify (all must pass; show the output)
- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
- SQL change: `npm run test:sql`.
- UI change: run `npm run dev` and exercise the flow in the browser.
- If anything fails, fix it. Do not open a PR with a red check.

## 5. Ship
- Commit (imperative, specific message), push, `gh pr create` with: what changed, why, how tested, follow-ups.
- Do not merge. Wait for the user to merge, or merge only if the user said so for this run.
- After merge: update `docs/build-tracker.html` (run the `build-tracker-updater` agent, then `node scripts/check-tracker.mjs`), tick `FEATURE_LIST.md`, tick the task in `docs/TASK-WORKFLOW.md`. If `ArtifactData` is available, `set` collection `ticks`, doc id = task id, data `{"done":true,"at":"<ISO>","by":"claude-code"}`.

## 6. Report, then stop
Reply with: 1) what changed (PR link), 2) verification commands and results, 3) security notes, 4) what the user must do themselves, 5) the next task in the queue. Stop. The user runs `/next-task` again, or `/loop /next-task` to chain tasks.
