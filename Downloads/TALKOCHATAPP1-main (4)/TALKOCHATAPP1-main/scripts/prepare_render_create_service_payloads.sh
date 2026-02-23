#!/usr/bin/env bash
set -euo pipefail

# Prepare ready-to-run curl commands for creating Render services via the Render API.
# This script prints JSON payloads and curl commands you can run after setting
# RENDER_API_KEY and filling in the repository and account details.
#
# Usage:
#   bash ./scripts/prepare_render_create_service_payloads.sh --repo "github.com/owner/repo" --branch render/deploy-render
#
REPO=""
BRANCH="render/deploy-render"
BACKEND_NAME="talkochat-backend"
FRONTEND_NAME="talkochat-frontend"

usage(){
  cat <<EOF
Usage: $0 --repo <git_repo> [--branch <branch>]

This prints curl commands to create two services on Render:
 - a Web Service for the backend
 - a Static Site for the frontend

You must set the environment variable RENDER_API_KEY before running the printed curl commands.
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    -h|--help) usage;;
    *) echo "Unknown arg: $1"; usage;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "--repo is required" >&2
  usage
fi

cat <<EOF
------------------------------------------------------------------------------
Render API curl commands (fill RENDER_API_KEY, GIT_PROVIDER and possibly account/org):

Replace placeholders before running (e.g. <RENDER_ACCOUNT_ID>, <GIT_PROVIDER>, <REPO_FULL_NAME>). Example repo full name: "owner/repo".

1) Create backend Web Service (example payload)

BACKEND_PAYLOAD='{
  "name": "${BACKEND_NAME}",
  "type": "web_service",
  "repo": "${REPO}",
  "repoBranch": "${BRANCH}",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "env": "node",
  "plan": "free"
}'

echo "curl -X POST https://api.render.com/v1/services -H \"Authorization: Bearer \$RENDER_API_KEY\" -H \"Content-Type: application/json\" -d \"$BACKEND_PAYLOAD\""


2) Create frontend Static Site (example payload)

FRONTEND_PAYLOAD='{
  "name": "${FRONTEND_NAME}",
  "type": "static_site",
  "repo": "${REPO}",
  "repoBranch": "${BRANCH}",
  "buildCommand": "cd client && npm install && npm run build",
  "publishPath": "client/dist",
  "plan": "free"
}'

echo "curl -X POST https://api.render.com/v1/services -H \"Authorization: Bearer \$RENDER_API_KEY\" -H \"Content-Type: application/json\" -d \"$FRONTEND_PAYLOAD\""

echo
echo "Notes:" 
echo " - The exact JSON fields Render accepts may vary; adjust payloads if the API rejects them."
echo " - For many users the Render dashboard (UI) is easier: connect your GitHub repo, choose branch 'render/deploy-render', then set build/start commands and env vars."
echo " - After creating services via the API or UI, use scripts/set_render_envs.sh to add DATABASE_URL and JWT_SECRET."
echo "------------------------------------------------------------------------------"
