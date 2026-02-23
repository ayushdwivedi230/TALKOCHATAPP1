Deployment on Render

Backend (web service):
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Env vars required: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`

Frontend (static site):
- Build command: `cd client && npm install && npm run build`
- Publish directory: `client/dist`

To push changes and trigger Render deploys:

```bash
cd path/to/repo
git add render.yaml README_RENDER.md server/index.ts
git commit -m "Prepare Render deployment: add render.yaml, instructions, backend-only server"
git push origin HEAD
```

If your repo has unrelated changes in parent folders, run the above from the project root `TALKOCHATAPP1-main`.
