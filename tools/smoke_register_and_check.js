const fs = require('fs');
const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const body = fs.readFileSync('tools/tmp-register.json','utf8');
    console.log('Posting to /api/auth/jwt/register...');
    const res = await fetch('http://localhost:5001/api/auth/jwt/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) { console.error('Non-JSON response:', text); process.exit(2); }
    console.log('Status:', res.status);
    console.log('Response user:', data.user || data);
    const user = data.user || data;
    if (!user) { console.error('No user returned'); process.exit(3); }
    const roles = user.roles || [];
    const active = user.activeRole || user.role || (roles.length ? roles[0] : undefined);
    console.log('Normalized roles:', roles);
    console.log('Resolved activeRole:', active);
    if (roles.includes('user') && roles.includes('vendor') && active === 'user') {
      console.log('SMOKE TEST PASSED: roles include user & vendor and activeRole defaults to user');
      process.exit(0);
    } else {
      console.error('SMOKE TEST FAILED: unexpected roles/activeRole');
      process.exit(4);
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
