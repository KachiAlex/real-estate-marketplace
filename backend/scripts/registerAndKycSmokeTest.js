/*
  Register a vendor with KYC docs and verify vendorData persists.
  Usage:
    API_BASE=http://localhost:5001 node backend/scripts/registerAndKycSmokeTest.js

  This test does NOT require an admin token and is safe to run in cloud/dev.
*/

const API_BASE = process.env.API_BASE || 'http://localhost:5001';

async function run() {
  const email = `smoke.vendor.${Date.now()}@example.com`;
  const payload = {
    email,
    password: 'Testpass1234',
    firstName: 'Smoke',
    lastName: 'Vendor',
    phone: '+10000000000',
    roles: ['user','vendor'],
    vendorKycDocs: [
      { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', name: 'sample.jpg' }
    ]
  };

  console.log('Registering vendor:', payload.email);
  const res = await fetch(`${API_BASE}/api/auth/jwt/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => null);
  console.log('Register status:', res.status);
  console.log('Register response:', json);
  if (!json || !json.success || !json.accessToken) {
    console.error('Registration failed — aborting smoke test');
    process.exit(1);
  }

  const token = json.accessToken;
  // Fetch current user profile to ensure vendorData persisted
  const meRes = await fetch(`${API_BASE}/api/auth/jwt/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  const meJson = await meRes.json().catch(() => null);
  console.log('Me status:', meRes.status);
  console.log('Me response:', meJson);

  if (!meJson || !meJson.success) {
    console.error('Failed to fetch user profile after registration');
    process.exit(1);
  }

  const vendorData = meJson.user.vendorData || meJson.user.vendorData;
  if (!vendorData) {
    console.error('vendorData not present on user — KYC persistence failed');
    process.exit(1);
  }

  console.log('Smoke test passed: vendorData persisted.');
  process.exit(0);
}

run().catch(err => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
