async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

async function main() {
  const base = 'http://localhost:5000';
  const creds = { username: 'yashi', password: 'password123' };

  console.log('Registering user...');
  const reg = await postJson(`${base}/api/auth/register`, creds);
  console.log('Register response:', reg.status, reg.body);

  console.log('Logging in...');
  const login = await postJson(`${base}/api/auth/login`, creds);
  console.log('Login response:', login.status, login.body);
}

main().catch(err => { console.error('Test script error:', err); process.exit(1); });
