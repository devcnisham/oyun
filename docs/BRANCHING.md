# Branches and Jira keys

## The branches

| Branch | Purpose | Deploys to | Who pushes |
| --- | --- | --- | --- |
| `main` | What customers get. Always passes CI. | Vercel **Production** | Only through a merged pull request |
| `staging` | Pre-release check with test data. Merge `main` into it (or a risky PR before `main`) to try it on the staging database. | Vercel Preview `git-staging` URL | Pull requests, or a merge from `main` |
| `feature/<task>` | One task, one pull request | Vercel Preview per branch | The developer |
| `fix/<task>` | A bug fix, same rules | Vercel Preview per branch | The developer |
| `hotfix/<task>` | An urgent production fix, branched from `main`, merged straight to `main` | Production after merge | The developer |

`staging` is only useful once Preview has its own Supabase project (task P8-12, and the Preview variables listed in `docs/ENVIRONMENTS.md`). Until then it behaves like any other preview. Branch protection (required reviews and checks) needs GitHub Pro on a private repository, so for now the rules are by agreement: merge only when every CI check is green.

## Jira keys: how GitHub and Jira find each other

Jira's **Development** panel on an issue lists the branches, commits and pull requests that mention its key (for example `OYUN-67`). That works once the "GitHub for Atlassian" app is connected to this repository. To make an item show up, put the key in:

- the **branch name**: `OYUN-67-race-test`, or `feature/OYUN-67-race-test`;
- the **pull request title**: `OYUN-67 Double-booking race test (P8-04)`;
- commit messages, when you can: `OYUN-67 add parallel session test`.

Use the key of the Jira issue for the task; find it by the tracker id in the summary (JQL `project = OYUN AND summary ~ "P8-04"`). One PR for several tasks lists all keys. Pull requests merged before this note were given their keys in the title (9 Oct 2026).

Smart commits: with the app connected, a commit message such as `OYUN-67 #comment fixed #done` can add a comment and transition the issue. We do not rely on it: statuses are moved after merge (see `docs/JIRA.md`).

## After a merge

1. Move the issue to Done and comment with the PR link (`docs/JIRA.md`).
2. Update `docs/build-tracker.html` and run `node scripts/check-tracker.mjs`.
3. Delete the merged branch (GitHub: the "Delete branch" button, or turn on "Automatically delete head branches" in the repository settings).
