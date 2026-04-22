// One-off script to list pending vendors and approve the first one
// Usage: node backend/scripts/adminKycRunLocal.js
const API_BASE = process.env.API_BASE || 'http://localhost:5001';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMmFkZGU2ZS1jMzk2LTRhZDYtODBhZi01YzJjMTZhYzhkOTQiLCJpYXQiOjE3NzE3MjkyMzgsImV4cCI6MTc3NDMyMTIzOH0.oDdRr-qCfGQCu-Uqn6PsxA_jZVxYiB4FnNCfDU_2BH8';

async function run() {
  try {
    console.log('API base:', API_BASE);
    console.log('Listing pending vendors...');
    const listRes = await fetch(`${API_BASE}/api/admin/vendors/pending`, { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
    const listJson = await listRes.json().catch(() => null);
    console.log('List response:', listJson);
    const vendors = (listJson && listJson.data) || [];
    if (!vendors.length) {
      console.log('No pending vendors found.');
      return;
    }
    const first = vendors[0];
    console.log('Approving vendor:', first.email, first.id);
    const approveRes = await fetch(`${API_BASE}/api/admin/vendors/${first.id}/kyc/approve`, { method: 'POST', headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' } });
    const approveJson = await approveRes.json().catch(() => null);
    console.log('Approve response:', approveJson);
  } catch (err) {
    console.error('Script error:', err);
    process.exitCode = 1;
  }
}

run();
