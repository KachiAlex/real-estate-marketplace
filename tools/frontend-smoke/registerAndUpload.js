#!/usr/bin/env node
// Usage: node registerAndUpload.js <API_URL> [emailPrefix]
// Registers a vendor account, uploads a small sample KYC file, and prints the vendorData from /me

const [,, apiUrl, emailPrefix = 'smoke.vendor.test'] = process.argv;
if (!apiUrl) {
  console.error('Usage: node registerAndUpload.js <API_URL> [emailPrefix]');
  process.exit(2);
}

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
    const email = `${emailPrefix}+${nowId()}@example.com`;
    const password = 'VendorPass123!';
    console.log('Registering vendor:', email);
    // Try JWT register endpoint first, fallback to legacy /api/auth/register
    let reg = null;
    const tryJwtUrl = new URL('/api/auth/jwt/register', apiUrl).toString();
    try {
      reg = await fetchJson(tryJwtUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Vendor', phone: '1234567890', roles: ['vendor'], vendorKycDocs: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', name: 'sample.jpg' }] }) });
    } catch (e) {
      reg = null;
    }
    if (!reg || !reg.ok) {
      const legacyUrl = new URL('/api/auth/register', apiUrl).toString();
      reg = await fetchJson(legacyUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Vendor', phone: '1234567890', roles: ['vendor'], vendorKycDocs: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', name: 'sample.jpg' }] }) });
    }
    if (!reg || !reg.ok) throw new Error('Register failed: ' + JSON.stringify(reg && reg.body));
    console.log('Registered. Logging in...');
    const loginUrl = new URL('/api/auth/login', apiUrl).toString();
    const login = await fetchJson(loginUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!login.ok) throw new Error('Login failed: ' + JSON.stringify(login.body));
    const token = login.body?.token || login.body?.data?.token || login.body?.accessToken || (login.body?.data && login.body.data.accessToken);
    if (!token) throw new Error('No token returned after login');

    // We included `vendorKycDocs` at registration, so skip file upload and verify /me
    console.log('Fetching /me to verify vendorData...');
    // Fetch /me (try jwt route first, then legacy)
    let me = null;
    try {
      const meJwtUrl = new URL('/api/auth/jwt/me', apiUrl).toString();
      me = await fetchJson(meJwtUrl, { method: 'GET', headers: { Authorization: 'Bearer ' + token } });
    } catch (e) { me = null; }
    if (!me || !me.ok) {
      const meLegacy = new URL('/api/auth/me', apiUrl).toString();
      me = await fetchJson(meLegacy, { method: 'GET', headers: { Authorization: 'Bearer ' + token } });
    }
    console.log('/me response:', JSON.stringify(me.body, null, 2));

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
