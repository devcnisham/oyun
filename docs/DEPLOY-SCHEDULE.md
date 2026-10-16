# Deploy schedule

Vercel's free plan allows 100 deployments a day, and every push to main or to a pull-request branch used to spend one.
Now **nothing deploys on push**. Work is merged whenever it is ready, and everything on `main` goes live together once a day.

| When (IST) | What happens |
|---|---|
| Any time | Open a PR. GitHub CI (lint, tests, build, e2e, Lighthouse) runs. No Vercel build is spent. |
| Any time | Merge to `main` once CI is green. The code is in the repo but the live site is unchanged. |
| **12:00 noon, every day** | `Scheduled deploy` (GitHub Actions) checks whether `main` moved since the `last-deployed` tag. If yes, it triggers one Vercel production build of `main`. If not, it does nothing and spends nothing. |
| About 3 minutes later | The live site shows every change merged since the last noon. |
| Urgent hotfix | Actions -> **Scheduled deploy** -> **Run workflow** (tick `force` if main has not changed). One deployment is spent. |

The live site is always `main` as of the last noon, so what is visible after noon matches the committed and merged code in the repo.

## How it is wired

- `vercel.json` sets `git.deploymentEnabled: false`, so pushes and pull requests no longer start Vercel builds (that also removes the preview URL on PRs).
- `.github/workflows/scheduled-deploy.yml` runs at `30 6 * * *` UTC (12:00 IST) and calls a Vercel **Deploy Hook** for `main`.
- The `last-deployed` git tag marks the commit that was last sent live.

## One-time setup (needs the Vercel owner)

1. Vercel -> **slot-arena** -> Settings -> Git -> **Deploy Hooks** -> create one named `noon`, branch `main`.
2. GitHub -> repo Settings -> Secrets and variables -> Actions -> new secret `VERCEL_DEPLOY_HOOK` with that URL.
3. Run the workflow once by hand to confirm it deploys.

Until step 2 is done, the noon job fails with a clear message and nothing deploys.
