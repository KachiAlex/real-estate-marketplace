/*
  Simple smoke test for admin KYC endpoints.
  Usage:
    ADMIN_TOKEN=ey... API_BASE=http://localhost:3000 node backend/scripts/adminKycSmokeTest.js
*/

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('ADMIN_TOKEN is required (export ADMIN_TOKEN=...)');
  process.exit(2);
}

async function run() {
  console.log('Listing pending vendors...');
  const listRes = await fetch(`${API_BASE}/api/admin/vendors/pending`, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
  const listJson = await listRes.json().catch(() => null);
  console.log('List response:', listJson);
  const vendors = (listJson && listJson.data) || [];
  if (!vendors.length) {
    console.log('No pending vendors to test against. Exiting.');
    return;
  }
  const first = vendors[0];
  console.log('Approving vendor:', first.email, first.id);
  const approveRes = await fetch(`${API_BASE}/api/admin/vendors/${first.id}/kyc/approve`, { method: 'POST', headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' } });
  const approveJson = await approveRes.json().catch(() => null);
  console.log('Approve response:', approveJson);
}

run().catch(err => { console.error('Smoke test failed:', err); process.exit(1); });
