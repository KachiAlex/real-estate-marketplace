/*
  Registration smoke test for create-account flow.
  Usage:
    API_BASE=http://localhost:3000 node backend/scripts/registerSmokeTest.js
  Optional env:
    REQUIRE_KYC=true - include vendorKycDocs in payload
*/

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const REQUIRE_KYC = process.env.REQUIRE_KYC === 'true';

async function run() {
  const email = `test.vendor.${Date.now()}@example.com`;
  const payload = {
    email,
    password: 'Testpass1234',
    firstName: 'Test',
    lastName: 'Vendor',
    phone: '+10000000000',
    roles: ['user','vendor']
  };

  if (REQUIRE_KYC) {
    // Provide a dummy KYC doc link (Cloudinary or public URL) so server accepts when REQUIRE_KYC_ON_REGISTER=true
    payload.vendorKycDocs = [
      { url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', name: 'sample.jpg' }
    ];
  }

  console.log('Registering user:', payload.email);
  const res = await fetch(`${API_BASE}/api/auth/jwt/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => null);
  console.log('Status:', res.status);
  console.log('Response:', json);
}

run().catch(err => { console.error('Smoke test failed:', err); process.exit(1); });
