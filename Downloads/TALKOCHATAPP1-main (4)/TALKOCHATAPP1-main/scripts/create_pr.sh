#!/usr/bin/env bash
set -euo pipefail

# Create a PR from render/deploy-render -> main using GitHub CLI (gh).
# Usage: bash ./scripts/create_pr.sh

BRANCH="render/deploy-render"
TITLE="Prepare Render deployment"
BODY="Prepare repo for Render: server start changes, client build fixes, render.yaml and instructions. Builds and client/dist validated locally. See README_RENDER_FULL.md for details."

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI and authenticate (gh auth login) then re-run."
  exit 1
fi

git fetch origin
git checkout "$BRANCH"
git push origin "$BRANCH"

gh pr create --base main --head "$BRANCH" --title "$TITLE" --body "$BODY"
echo "PR creation attempted. Check gh output above for the PR URL."
