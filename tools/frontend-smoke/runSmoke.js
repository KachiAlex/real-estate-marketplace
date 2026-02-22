#!/usr/bin/env node
// Simple frontend→backend smoke test.
// Usage: node runSmoke.js <FRONTEND_URL> <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>

const [,, frontendUrl, apiUrl, adminEmail, adminPassword] = process.argv;
if (!frontendUrl || !apiUrl || !adminEmail || !adminPassword) {
  console.error('Usage: node runSmoke.js <FRONTEND_URL> <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>');
  process.exit(2);
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  let body;
  try { body = await res.json(); } catch (e) { body = await res.text(); }
  return { ok: res.ok, status: res.status, body };
}

(async function run() {
  try {
    console.log('Checking frontend:', frontendUrl);
    const f = await fetch(frontendUrl, { method: 'GET' });
    if (!f.ok) throw new Error(`Frontend returned ${f.status}`);
    console.log('Frontend reachable (HTTP', f.status + ')');

    const healthUrl = new URL('/api/health', apiUrl).toString();
    console.log('Checking backend health:', healthUrl);
    const h = await fetchJson(healthUrl, { method: 'GET' });
    if (!h.ok) throw new Error(`API health returned ${h.status} - ${JSON.stringify(h.body)}`);
    console.log('API health OK');

    const loginUrl = new URL('/api/auth/login', apiUrl).toString();
    console.log('Logging in admin at:', loginUrl);
    const login = await fetchJson(loginUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    if (!login.ok) throw new Error(`Login failed: ${JSON.stringify(login.body)}`);
    const token = login.body?.token || (login.body?.data && login.body.data.token);
    if (!token) throw new Error('Login succeeded but no token returned');
    console.log('Login successful; token obtained');

    const pendingUrl = new URL('/api/admin/vendors/pending', apiUrl).toString();
    console.log('Fetching pending vendors:', pendingUrl);
    const pending = await fetchJson(pendingUrl, { method: 'GET', headers: { 'authorization': 'Bearer ' + token } });
    console.log('Pending vendors response:', JSON.stringify(pending.body));

    console.log('Smoke test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err.message || err);
    process.exit(1);
  }
})();
