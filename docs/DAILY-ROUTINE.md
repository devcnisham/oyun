# Daily and weekly routine

How work moves from an idea to the live site, and what runs on its own. Times are IST.

## A normal day

| When | Who or what | What |
|---|---|---|
| Any time | You or Claude | Pick the next task (`/next-task`, see [TASK-WORKFLOW.md](TASK-WORKFLOW.md)) and follow the 18 steps in [FEATURE-WORKFLOW.md](FEATURE-WORKFLOW.md). Work on a branch, never on `main` ([BRANCHING.md](BRANCHING.md)). |
| Any time | CI (GitHub Actions) | Every pull request runs lint, type-check, unit tests, build, e2e, Lighthouse, SQL tests and the secret scan. No Vercel build is spent. |
| Any time | You | Merge a PR when every check is green. The change is now in the repo but not yet live. |
| **12:00** | `Scheduled deploy` | If `main` moved since the `last-deployed` tag, trigger one Vercel production build. Otherwise do nothing. See [DEPLOY-SCHEDULE.md](DEPLOY-SCHEDULE.md). |
| **13:00** | `Post-deploy check` | Smoke test the live site and confirm cached pages come from the CDN. On failure it opens an issue. |
| On every merge | `Release Pipeline` | Builds `main` once, runs the staging smoke gate, waits for owner approval, tags the release. It does not deploy to Vercel. |
| **07:30** | `database-backup` | Nightly database backup (see the workflow file). |

Hotfix that cannot wait for noon: Actions -> **Scheduled deploy** -> **Run workflow**, then **Post-deploy check** -> **Run workflow** once it has finished building.

## Every Monday, 06:30

`Weekly routine` posts one issue with: `npm audit`, unused code (knip), branches already merged that can be deleted, and PRs open for more than a week. Dependabot also opens its weekly dependency PRs the same morning.

## Checklist before merging

- CI is green on the latest commit.
- The PR description says what changed and how it was checked.
- Anything that touches security, payments or the database has been read by a person.
- You know the change goes live at the next noon.

## Coding session checklist

Run through this in order each session. Each stage is also a checklist in the build tracker (Checklists, `CS1` to `CS9`).

### Plan

- [ ] Review the backlog
- [ ] Select today's tasks
- [ ] Estimate time
- [ ] Update the kanban board / Jira
- [ ] Review roadmap and prioritise the next set of work
- [ ] Plan the feature or idea before coding

### Develop

- [ ] Build frontend
- [ ] Build backend
- [ ] Database changes (migration plus SQL test)
- [ ] API implementation
- [ ] Authentication
- [ ] File storage
- [ ] Payments
- [ ] Notifications
- [ ] Background jobs

### Debug

- [ ] Fix reported bugs (log in docs/BUGS.md)
- [ ] Fix console errors
- [ ] Fix API issues
- [ ] Fix UI issues
- [ ] Fix responsive layouts
- [ ] Fix performance bottlenecks

### Code quality

- [ ] Refactor code
- [ ] Remove duplicate code
- [ ] Rename unclear variables
- [ ] Improve folder structure
- [ ] Add comments where needed
- [ ] Improve architecture

### Test

- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Manual testing
- [ ] Edge-case testing
- [ ] Mobile testing
- [ ] Desktop testing

### Git

- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Write meaningful commit messages
- [ ] Tag releases when needed
- [ ] Code review the diff before merge

### Deploy

- [ ] Build production version
- [ ] Run the CI pipeline
- [ ] Deploy (noon workflow)
- [ ] Verify deployment
- [ ] Check logs
- [ ] Roll back if needed

### Monitor

- [ ] Check server logs
- [ ] Check analytics
- [ ] Monitor uptime
- [ ] Monitor errors
- [ ] Monitor database

### Docs

- [ ] Update README
- [ ] Update API docs
- [ ] Update changelog
- [ ] Update feature list

## Where things are

- Phases and where each stands: [PHASES.md](PHASES.md).
- Workflows: `.github/workflows/` (`ci.yml`, `release-pipeline.yml`, `scheduled-deploy.yml`, `post-deploy-check.yml`, `weekly-routine.yml`, `database-backup.yml`).
- Runbooks for incidents: [RUNBOOKS.md](RUNBOOKS.md). Environments: [ENVIRONMENTS.md](ENVIRONMENTS.md).
