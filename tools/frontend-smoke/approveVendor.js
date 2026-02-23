#!/usr/bin/env node
// Usage: node approveVendor.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD> <VENDOR_ID>

const [,, apiUrl, adminEmail, adminPassword, vendorId] = process.argv;
if (!apiUrl || !adminEmail || !adminPassword || !vendorId) {
  console.error('Usage: node approveVendor.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD> <VENDOR_ID>');
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
    const loginUrl = new URL('/api/auth/login', apiUrl).toString();
    console.log('Logging in:', loginUrl);
    const login = await fetchJson(loginUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    if (!login.ok) throw new Error('Login failed: ' + JSON.stringify(login.body));
    const token = login.body?.token || (login.body?.data && login.body.data.token);
    if (!token) throw new Error('No token returned');

    const approveUrl = new URL(`/api/admin/vendors/${vendorId}/kyc/approve`, apiUrl).toString();
    console.log('Approving vendor:', approveUrl);
    const res = await fetchJson(approveUrl, { method: 'POST', headers: { 'authorization': 'Bearer ' + token } });
    console.log('Approve response:', JSON.stringify(res.body));
    process.exit(res.ok ? 0 : 1);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
