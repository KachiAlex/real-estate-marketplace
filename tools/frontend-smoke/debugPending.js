#!/usr/bin/env node
// Debug script: login as admin, call /api/admin/vendors/pending, and print full details.
// Usage: node debugPending.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>

const [,, apiUrl, adminEmail, adminPassword] = process.argv;
if (!apiUrl || !adminEmail || !adminPassword) {
  console.error('Usage: node debugPending.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>');
  process.exit(2);
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  let body;
  try { body = await res.json(); } catch (e) { body = await res.text(); }
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers), body };
}

(async function run() {
  try {
    const loginUrl = new URL('/api/auth/login', apiUrl).toString();
    console.log('POST', loginUrl);
    const login = await fetchJson(loginUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    console.log('Login status:', login.status, 'ok:', login.ok);
    console.log('Login body:', JSON.stringify(login.body));
    const token = login.body?.token || (login.body?.data && login.body.data.token);
    if (!token) throw new Error('No token returned from login');

    const pendingUrl = new URL('/api/admin/vendors/pending', apiUrl).toString();
    console.log('\nGET', pendingUrl);
    const pending = await fetchJson(pendingUrl, { method: 'GET', headers: { 'authorization': 'Bearer ' + token } });
    console.log('Pending status:', pending.status, 'ok:', pending.ok);
    console.log('Pending headers:', JSON.stringify(pending.headers));
    console.log('Pending body:', JSON.stringify(pending.body));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
