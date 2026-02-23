#!/usr/bin/env node
// Usage: node approveAndVerify.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD> <DATABASE_URL>
// Logs in, lists pending vendors, approves the first, and verifies DB vendorData.kycStatus == 'approved'

const [,, apiUrl, adminEmail, adminPassword, databaseUrl] = process.argv;
if (!apiUrl || !adminEmail || !adminPassword || !databaseUrl) {
  console.error('Usage: node approveAndVerify.js <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD> <DATABASE_URL>');
  process.exit(2);
}

const { Sequelize } = require('sequelize');

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  let body;
  try { body = await res.json(); } catch (e) { body = await res.text(); }
  return { ok: res.ok, status: res.status, body };
}

(async function run() {
  try {
    const loginUrl = new URL('/api/auth/login', apiUrl).toString();
    console.log('Logging in...');
    const login = await fetchJson(loginUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPassword }) });
    if (!login.ok) throw new Error('Login failed: ' + JSON.stringify(login.body));
    const token = login.body?.token || (login.body?.data && login.body.data.token);
    if (!token) throw new Error('No token returned');

    const pendingUrl = new URL('/api/admin/vendors/pending', apiUrl).toString();
    console.log('Listing pending vendors...');
    const pending = await fetchJson(pendingUrl, { method: 'GET', headers: { Authorization: 'Bearer ' + token } });
    if (!pending.ok) throw new Error('Pending list failed: ' + JSON.stringify(pending.body));
    const list = pending.body?.data || [];
    console.log('Pending count:', list.length);
    if (!list.length) {
      console.log('No pending vendors to approve');
      process.exit(0);
    }

    const vid = list[0].id;
    console.log('Approving vendor id:', vid);
    const approveUrl = new URL(`/api/admin/vendors/${vid}/kyc/approve`, apiUrl).toString();
    const approveRes = await fetchJson(approveUrl, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    console.log('Approve response:', JSON.stringify(approveRes.body));
    if (!approveRes.ok && !approveRes.body?.success) throw new Error('Approve failed: ' + JSON.stringify(approveRes.body));

    console.log('Verifying DB record...');
    const sequelize = new Sequelize(databaseUrl, { logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });
    await sequelize.authenticate();
    const sql = `SELECT "vendorData"::text as vendorDataText FROM users WHERE id = :id LIMIT 1`;
    const rows = await sequelize.query(sql, { replacements: { id: vid }, type: Sequelize.QueryTypes.SELECT });
    await sequelize.close();
    if (!rows || !rows.length) throw new Error('User not found in DB after approve');
    const vdText = rows[0].vendordatatext || rows[0].vendorDataText || rows[0].vendorData || null;
    let vd = null;
    try { vd = vdText ? JSON.parse(vdText) : null; } catch (e) { vd = null; }
    console.log('VendorData:', vd);
    if (vd && vd.kycStatus === 'approved') {
      console.log('Approve verified in DB');
      process.exit(0);
    }
    throw new Error('Vendor KYC not approved in DB');

  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
