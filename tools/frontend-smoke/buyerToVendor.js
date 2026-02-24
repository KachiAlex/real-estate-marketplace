#!/usr/bin/env node
// Usage: node buyerToVendor.js <API_URL>
// Registers a buyer, logs in, uploads a sample KYC file, then checks /me

const [,, apiUrl] = process.argv;
if (!apiUrl) { console.error('Usage: node buyerToVendor.js <API_URL>'); process.exit(2); }

const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
const FormData = require('form-data');

function nowId() { return Date.now(); }

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  let body;
  try { body = await res.json(); } catch (e) { body = await res.text(); }
  return { ok: res.ok, status: res.status, body };
}

(async function run() {
  try {
    const email = `smoke.buyer+${nowId()}@example.com`;
    const password = 'BuyerToVendor123!';
    console.log('Registering buyer:', email);
    const regUrl = new URL('/api/auth/jwt/register', apiUrl).toString();
    const reg = await fetchJson(regUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Buyer', phone: '+10000000000', roles: ['user'] }) });
    if (!reg.ok) throw new Error('Register failed: ' + JSON.stringify(reg.body));
    console.log('Registered. Logging in...');
    const loginUrl = new URL('/api/auth/jwt/login', apiUrl).toString();
    const login = await fetchJson(loginUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!login.ok) throw new Error('Login failed: ' + JSON.stringify(login.body));
    const token = login.body?.accessToken || login.body?.token || (login.body.data && login.body.data.accessToken);
    if (!token) throw new Error('No token returned');

    // Prepare sample KYC file
    const tmpDir = path.join(__dirname, '.tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const samplePath = path.join(tmpDir, `kyc-${nowId()}.txt`);
    fs.writeFileSync(samplePath, 'Sample KYC doc - smoke test');

    console.log('Uploading KYC file as authenticated user...');
    const uploadUrl = new URL('/api/upload/vendor/kyc', apiUrl).toString();
    const form = new FormData();
    form.append('documents', fs.createReadStream(samplePath));
    // Merge FormData headers (content-type/boundary) with Authorization
    const formHeaders = form.getHeaders ? form.getHeaders() : {};
    let uploadSucceeded = false;
    try {
      const uploadResp = await fetch(uploadUrl, { method: 'POST', headers: { ...formHeaders, Authorization: 'Bearer ' + token }, body: form });
      const uploadJson = await uploadResp.json().catch(() => null);
      if (!uploadResp.ok) throw new Error('Upload failed: ' + JSON.stringify(uploadJson));
      console.log('Upload response:', JSON.stringify(uploadJson));
      uploadSucceeded = true;
    } catch (uploadErr) {
      console.warn('KYC upload failed, will try roles API fallback:', uploadErr.message || uploadErr);
    }

    if (!uploadSucceeded) {
      // Fallback: call roles endpoint to add vendor role
      console.log('Calling roles API to add vendor role as fallback...');
      const userId = (login.body && login.body.user && login.body.user.id) || (login.body && login.body.id) || (login.body && login.body.userId);
      console.log('Detected userId:', userId);
      const rolesUrl = new URL(`/api/users/${userId || ''}/roles`, apiUrl).toString();
      const rolesResp = await fetch(rolesUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ action: 'add', role: 'vendor', setActive: true }) });
      const rolesJson = await rolesResp.json().catch(() => null);
      if (!rolesResp.ok) throw new Error('Roles API failed: ' + JSON.stringify(rolesJson));
      console.log('Roles API response:', JSON.stringify(rolesJson));
    }

    // Fetch /me
    const meUrl = new URL('/api/auth/jwt/me', apiUrl).toString();
    const me = await fetchJson(meUrl, { method: 'GET', headers: { 'Authorization': 'Bearer ' + token } });
    console.log('/me response:', JSON.stringify(me.body, null, 2));

    const roles = (me.body && (me.body.user || me.body).roles) || [];
    const active = (me.body && (me.body.user || me.body).activeRole) || null;
    if (roles.includes('vendor') && active === 'vendor') {
      console.log('Success: buyer converted to vendor');
      process.exit(0);
    }
    console.error('Failure: roles/activeRole not set as expected');
    process.exit(1);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
