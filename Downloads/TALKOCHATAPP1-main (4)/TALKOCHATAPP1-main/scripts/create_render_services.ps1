<#
PowerShell helper to create a GitHub PR and show Render deployment steps.

Usage (from repo root):
  pwsh ./scripts/create_render_services.ps1

This script will attempt to:
- create a PR from `render/deploy-render` -> `main` using `gh` (GitHub CLI)
  (requires `gh auth login` already performed)
- print Render dashboard instructions and example Render API curl snippets
  (requires you to run them with your `RENDER_API_KEY` if you want automation).

The script does not change remote services automatically (requires credentials).
#>

function Ensure-Command {
    param($cmd)
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

Write-Host "Step 1: Create GitHub PR from 'render/deploy-render' to 'main' (if gh available)"
if (Ensure-Command gh) {
    gh pr create --base main --head render/deploy-render --title "Prepare Render deployment" --body "Prepare repo for Render: server start changes, client build fixes, render.yaml and instructions. Builds and client/dist validated locally. See README_RENDER.md for details." --assignee @me
    if ($LASTEXITCODE -ne 0) {
        Write-Host "gh pr create failed or was cancelled. You can run the command manually above." -ForegroundColor Yellow
    }
} else {
    Write-Host "GitHub CLI 'gh' not found. Install it or run this command manually:" -ForegroundColor Yellow
    Write-Host "gh pr create --base main --head render/deploy-render --title \"Prepare Render deployment\" --body \"Prepare repo for Render...\""
}

Write-Host "`nStep 2: Create Render services (manual steps / API examples below)"
Write-Host "Render dashboard (recommended):"
Write-Host "  - Create Web Service -> connect repo, choose branch 'render/deploy-render'"
Write-Host "    Build Command: npm install && npm run build"
Write-Host "    Start Command: npm start"
Write-Host "    Env: DATABASE_URL (secure), JWT_SECRET (secure), NODE_ENV=production"
Write-Host "  - Create Static Site -> connect repo, choose branch 'render/deploy-render'"
Write-Host "    Build Command: cd client && npm install && npm run build"
Write-Host "    Publish dir: client/dist"

Write-Host "`nOptional: Render API examples (useful for automation). Set environment variable RENDER_API_KEY first."
Write-Host "Replace <SERVICE_ID> with the actual service id returned by Render."

Write-Host "Example: set env var via Render API (bash/curl):"
Write-Host "curl -X POST \"https://api.render.com/v1/services/<SERVICE_ID>/env-vars\" -H \"Authorization: Bearer $env:RENDER_API_KEY\" -H \"Content-Type: application/json\" -d '{"key":"DATABASE_URL","value":"postgres://user:pass@host:5432/db","secure":true}'"

Write-Host "To patch multiple env vars in one request (example):"
Write-Host "curl -X PATCH \"https://api.render.com/v1/services/<SERVICE_ID>\" -H \"Authorization: Bearer $env:RENDER_API_KEY\" -H \"Content-Type: application/json\" -d '{"envVars":[{"key":"DATABASE_URL","value":"<value>","secure":true},{"key":"JWT_SECRET","value":"<value>","secure":true}]}'"

Write-Host "`nNotes:"
Write-Host " - You will usually create the services first in the Render UI; then add env vars in the service settings."
Write-Host " - The branch 'render/deploy-render' already contains the server and client fixes and 'render.yaml'."
Write-Host " - If you want me to prepare a fully automated Render API script, I can add it, but you will need to provide a Render API key (or run it locally)."

Write-Host "Done. Run this script from the repo root to perform the GH PR step and see Render guidance."
