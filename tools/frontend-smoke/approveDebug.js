#!/usr/bin/env node
// Usage: node approveDebug.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>
// Logs in, lists pending vendors, approves first vendor, and prints full response

const [,, apiUrl, adminEmail, adminPassword] = process.argv;
if (!apiUrl || !adminEmail || !adminPassword) {
  console.error('Usage: node approveDebug.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>');
  process.exit(2);
}

async function fetchJsonWithDetails(url, opts) {
  const res = await fetch(url, opts);
  let body;
  try { body = await res.json(); } catch (e) { body = await res.text(); }
  const headers = {};
  for (const [k,v] of res.headers) headers[k] = v;
  return { status: res.status, ok: res.ok, headers, body };
}

(async function run() {
  try {
    const loginUrl = new URL('/api/auth/login', apiUrl).toString();
    console.log('POST', loginUrl);
    const login = await fetchJsonWithDetails(loginUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
    console.log('Login ->', login.status, login.ok);
    console.log('Login body:', JSON.stringify(login.body));
    const token = login.body?.token || (login.body?.data && login.body.data.token);
    if (!token) throw new Error('No token returned');

    const pendingUrl = new URL('/api/admin/vendors/pending', apiUrl).toString();
    console.log('GET', pendingUrl);
    const pending = await fetchJsonWithDetails(pendingUrl, { method: 'GET', headers: { Authorization: 'Bearer ' + token } });
    console.log('Pending ->', pending.status, pending.ok);
    console.log('Pending body:', JSON.stringify(pending.body));
    const list = pending.body?.data || [];
    if (!list.length) {
      console.log('No pending vendors');
      process.exit(0);
    }

    const vid = list[0].id;
    const approveUrl = new URL(`/api/admin/vendors/${vid}/kyc/approve`, apiUrl).toString();
    console.log('POST', approveUrl);
    const approve = await fetch(approveUrl, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    const approveHeaders = {};
    for (const [k,v] of approve.headers) approveHeaders[k] = v;
    let approveBody;
    try { approveBody = await approve.json(); } catch (e) { approveBody = await approve.text(); }
    console.log('Approve status:', approve.status);
    console.log('Approve headers:', JSON.stringify(approveHeaders));
    console.log('Approve body:', JSON.stringify(approveBody));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
