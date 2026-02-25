const fs = require('fs');
const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const body = fs.readFileSync('tools/tmp-register.json','utf8');
    const res = await fetch('http://localhost:5001/api/auth/jwt/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
