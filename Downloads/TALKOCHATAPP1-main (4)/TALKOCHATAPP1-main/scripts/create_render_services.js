#!/usr/bin/env node
/*
Automate Render service creation + env var setup.

Usage:
  node ./scripts/create_render_services.js \
    --repo owner/repo \
    --branch render/deploy-render \
    --api-key <RENDER_API_KEY> \
    --database-url "postgres://..." \
    --jwt-secret "<secret>"

Notes:
 - This script uses the Render REST API. API surface may differ; inspect responses.
 - It will attempt to create two services (web + static) and then patch env vars for the web service.
 - If you prefer the UI, use README_RENDER_FULL.md instructions instead.
*/

const https = require('https');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i+1] && !args[i+1].startsWith('--') ? args[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

function apiRequest(method, path, apiKey, body) {
  const data = body ? JSON.stringify(body) : null;
  const options = {
    hostname: 'api.render.com',
    port: 443,
    path,
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        let parsed = chunks;
        try { parsed = JSON.parse(chunks); } catch (e) {}
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject({ status: res.statusCode, body: parsed });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const args = parseArgs();
  const apiKey = args['api-key'] || process.env.RENDER_API_KEY;
  if (!apiKey) {
    console.error('RENDER_API_KEY is required (pass --api-key or set RENDER_API_KEY)');
    process.exit(1);
  }
  const repo = args['repo'];
  const branch = args['branch'] || 'render/deploy-render';
  const dbUrl = args['database-url'] || args['database_url'] || '';
  const jwt = args['jwt-secret'] || args['jwt_secret'] || '';

  if (!repo) {
    console.error('Missing --repo owner/repo');
    process.exit(1);
  }

  console.log('Creating backend web service...');
  const backendPayload = {
    name: 'talkochat-backend',
    type: 'web_service',
    repo: repo,
    repoBranch: branch,
    buildCommand: 'npm install && npm run build',
    startCommand: 'npm start'
  };

  let backendResp;
  try {
    backendResp = await apiRequest('POST', '/v1/services', apiKey, backendPayload);
    console.log('Backend created:', backendResp);
  } catch (err) {
    console.error('Failed to create backend service:', err);
    process.exit(1);
  }

  console.log('Creating frontend static site...');
  const frontendPayload = {
    name: 'talkochat-frontend',
    type: 'static_site',
    repo: repo,
    repoBranch: branch,
    buildCommand: 'cd client && npm install && npm run build',
    publishPath: 'client/dist'
  };

  let frontendResp;
  try {
    frontendResp = await apiRequest('POST', '/v1/services', apiKey, frontendPayload);
    console.log('Frontend created:', frontendResp);
  } catch (err) {
    console.error('Failed to create frontend service:', err);
    process.exit(1);
  }

  // Patch env vars for backend if provided
  if (dbUrl || jwt) {
    const serviceId = backendResp && backendResp.id ? backendResp.id : backendResp.service ? backendResp.service.id : null;
    if (!serviceId) {
      console.warn('Could not determine backend service id from response; print response and set env vars manually.');
      console.log(backendResp);
      process.exit(0);
    }
    const envVars = [];
    if (dbUrl) envVars.push({ key: 'DATABASE_URL', value: dbUrl, secure: true });
    if (jwt) envVars.push({ key: 'JWT_SECRET', value: jwt, secure: true });
    envVars.push({ key: 'NODE_ENV', value: 'production', secure: false });

    const patchBody = { envVars };
    try {
      const patchResp = await apiRequest('PATCH', `/v1/services/${serviceId}`, apiKey, patchBody);
      console.log('Patched backend env vars:', patchResp);
    } catch (err) {
      console.error('Failed to patch env vars:', err);
      process.exit(1);
    }
  }

  console.log('\nDone. Services created. Verify in Render dashboard and trigger deploys if needed.');
}

main().catch((err) => { console.error(err); process.exit(1); });
