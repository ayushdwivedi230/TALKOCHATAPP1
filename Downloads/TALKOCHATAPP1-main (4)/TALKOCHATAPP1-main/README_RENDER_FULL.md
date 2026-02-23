Deployment on Render — Full Instructions

This repository contains two services for Render:

- Backend: `talkochat-backend` (web service)
- Frontend: `talkochat-frontend` (static site)

Branch
- Use branch: `render/deploy-render` (this branch contains the build fixes and `render.yaml`).

Backend (web service) — Render dashboard settings
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables (set as secure env vars in Render):
  - `DATABASE_URL` — Postgres connection string
  - `JWT_SECRET` — JWT signing secret
  - `NODE_ENV` — `production`

Frontend (static site) — Render dashboard settings
- Build command: `cd client && npm install && npm run build`
- Publish directory: `client/dist`

Local helper scripts (in `scripts/`)

- `create_pr.sh` — uses GitHub CLI `gh` to create a PR from `render/deploy-render` -> `main`.
- `set_render_envs.sh` — helper that uses your `RENDER_API_KEY` to patch service env vars by service id.

Example local workflow

1. Run client build locally to verify:

```bash
cd client
npm ci
npm run build
```

2. Push branch and create PR (locally):

```bash
bash ./scripts/create_pr.sh
```

3. Create services in Render (dashboard recommended):

- Create Web Service -> choose `render/deploy-render`, set build and start commands above, add env vars.
- Create Static Site -> choose `render/deploy-render`, set build command and publish dir above.

4. (Optional) Use `set_render_envs.sh` to set env vars via Render API (you need `RENDER_API_KEY` and your service IDs):

```bash
bash ./scripts/set_render_envs.sh \
  --service-id-web <WEB_SERVICE_ID> \
  --service-id-static <STATIC_SERVICE_ID> \
  --database-url "postgres://user:pass@host:5432/db" \
  --jwt-secret "<secure-secret>"
```

Notes & troubleshooting

- If the client build fails on Render, make sure all optional PostCSS/Tailwind plugins are present or removed; the branch contains the minimal config used for CI.
- If a Render deploy fails, check both build logs (for client) and server `npm start` logs for missing env vars.
- If you want me to automate Render service creation via the API, provide a Render API key and indicate whether you want me to create the services programmatically.
