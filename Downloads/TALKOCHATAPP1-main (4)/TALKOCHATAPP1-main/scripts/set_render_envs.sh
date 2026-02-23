#!/usr/bin/env bash
set -euo pipefail

# Helper to patch environment variables for an existing Render service via API.
# Requires: environment variable RENDER_API_KEY set, and the target service IDs.
# Usage:
# bash ./scripts/set_render_envs.sh --service-id-web <WEB_ID> --service-id-static <STATIC_ID> --database-url "postgres://..." --jwt-secret "<secret>"

API_KEY_DEFAULT="${RENDER_API_KEY:-}"

usage(){
  cat <<EOF
Usage: $0 --service-id-web <WEB_ID> --service-id-static <STATIC_ID> --database-url <DB> --jwt-secret <SECRET> [--api-key <KEY>]

This will PATCH the Render service(s) and set env vars: DATABASE_URL, JWT_SECRET, NODE_ENV=production
EOF
  exit 1
}

SERVICE_ID_WEB=""
SERVICE_ID_STATIC=""
DATABASE_URL=""
JWT_SECRET=""
API_KEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service-id-web) SERVICE_ID_WEB="$2"; shift 2;;
    --service-id-static) SERVICE_ID_STATIC="$2"; shift 2;;
    --database-url) DATABASE_URL="$2"; shift 2;;
    --jwt-secret) JWT_SECRET="$2"; shift 2;;
    --api-key) API_KEY="$2"; shift 2;;
    -h|--help) usage;;
    *) echo "Unknown arg: $1"; usage;;
  esac
done

API_KEY="${API_KEY:-$API_KEY_DEFAULT}"
if [[ -z "$API_KEY" ]]; then
  echo "RENDER_API_KEY must be set or pass --api-key" >&2
  exit 1
fi

patch_service(){
  local service_id="$1"
  echo "Patching service $service_id"
  curl -sS -X PATCH "https://api.render.com/v1/services/${service_id}" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"envVars\":[{\"key\":\"DATABASE_URL\",\"value\":\"${DATABASE_URL}\",\"secure\":true},{\"key\":\"JWT_SECRET\",\"value\":\"${JWT_SECRET}\",\"secure\":true},{\"key\":\"NODE_ENV\",\"value\":\"production\",\"secure\":false}]}"
}

if [[ -n "$SERVICE_ID_WEB" ]]; then
  patch_service "$SERVICE_ID_WEB"
fi
if [[ -n "$SERVICE_ID_STATIC" ]]; then
  patch_service "$SERVICE_ID_STATIC"
fi

echo "Done. Check the Render dashboard for updated environment variables and redeploy if needed."
