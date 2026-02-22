const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const fetch = global.fetch || ((...a)=>import('node:undici').then(m=>m.fetch(...a)));
const API_BASE = process.argv[2] || process.env.API_BASE;
const email = process.argv[3];
const password = process.argv[4];

if (!API_BASE || !email || !password) {
  console.error('Usage: node getAdminTokenAndRunSmoke.js <api_base> <email> <password>');
  process.exit(1);
}

;(async function(){
  try {
    // Try /api/auth/jwt/login then fallback to /api/auth/login
    let loginRes = await fetch(`${API_BASE.replace(/\/$/, '')}/api/auth/jwt/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    }).catch(()=>null);

    if (!loginRes || loginRes.status === 404) {
      loginRes = await fetch(`${API_BASE.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
    }

    const li = await loginRes.json().catch(()=>null);
    if (!li || (!li.accessToken && !li.token && !li.jwt && !li.id_token)) {
      console.error('Login failed:', JSON.stringify(li));
      process.exit(2);
    }

    const token = li.accessToken || li.token || li.jwt || li.id_token;
    console.log('Got token (truncated):', (token||'').toString().slice(0,40)+'...');

    // Run admin list check
    const list = await fetch(`${API_BASE.replace(/\/$/, '')}/api/admin/vendors/pending`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const lj = await list.json().catch(()=>null);
    console.log('Admin pending vendors response:', JSON.stringify(lj));

  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
