const http = require('http');
const fs = require('fs');
const payload = fs.readFileSync('tmp_register_payload.json','utf8');
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/jwt/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try { console.log(JSON.parse(data)); } catch(e){ console.log(data); }
  });
});
req.on('error', (e) => { console.error('ERR', e.message); });
req.write(payload);
req.end();
