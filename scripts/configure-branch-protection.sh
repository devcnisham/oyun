#!/usr/bin/env bash
# Configures GitHub branch protection on main via gh api.
# Requires GitHub Pro for private repos, or public repo visibility.
# On GitHub Free private repos, pre-push client hook (.githooks/pre-push) protects local checkouts.
set -euo pipefail

REPO="${1:-devcnisham/oyun}"
BRANCH="${2:-main}"

echo "Configuring branch protection on $REPO branch $BRANCH..."

PAYLOAD=$(cat <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint, type-check, unit tests, build",
      "Secret scan (Gitleaks)",
      "SQL migrations and tests (Postgres 17)",
      "End-to-end (Playwright, desktop + mobile)",
      "Lighthouse (home, arenas, turf page >= 90)"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
)

if gh api --method PUT "repos/$REPO/branches/$BRANCH/protection" --input - <<< "$PAYLOAD" 2>/dev/null; then
  echo "✔ Branch protection enabled on $REPO:$BRANCH with required CI status checks."
else
  echo "ℹ Note: GitHub API requires GitHub Pro or public repo visibility to enable server-side branch protection on private repos."
  echo "  Client-side protection is active via .githooks/pre-push."
fi
