// Create an admin user (unprotected endpoint), login, list pending vendors, and approve the first one.
// Usage: node backend/scripts/createAdminAndApprove.js
const API_BASE = process.env.API_BASE || 'http://localhost:5001';

async function http(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function run() {
  try {
    const adminEmail = `smoke.admin.${Date.now()}@example.com`;
    const adminPass = 'AdminPass123!';
    console.log('Creating admin:', adminEmail);
    const create = await http('/api/admin/create-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPass, firstName: 'Smoke', lastName: 'Admin' }) });
    console.log('Create admin response:', create.json);
    console.log('Logging in admin...');
    const login = await http('/api/auth/jwt/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPass }) });
    console.log('Login response:', login.json);
    const token = login.json?.accessToken;
    if (!token) {
      console.error('Failed to get admin token');
      return;
    }
    console.log('Using token to list pending vendors...');
    const list = await http('/api/admin/vendors/pending', { headers: { Authorization: `Bearer ${token}` } });
    console.log('List response:', list.json);
    const vendors = (list.json && list.json.data) || [];
    if (!vendors.length) {
      console.log('No pending vendors found to approve.');
      return;
    }
    const first = vendors[0];
    console.log('Approving vendor:', first.email, first.id);
    const approve = await http(`/api/admin/vendors/${first.id}/kyc/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    console.log('Approve response:', approve.json);
  } catch (err) {
    console.error('Script error:', err);
    process.exitCode = 1;
  }
}

run();
