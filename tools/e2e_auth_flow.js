const fetch = global.fetch || require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const util = require('util');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:5001';
const email = process.argv[3] || 'smoke.e2e@example.com';
const password = process.argv[4] || 'Passw0rd!';
const kycFile = path.join(__dirname, 'tmp-kyc-debug.txt');

// ensure a small temp KYC file exists for upload tests
if (!fs.existsSync(kycFile)) {
  fs.writeFileSync(kycFile, 'e2e-kyc-debug');
}

(async () => {
  try {
    console.log('Logging in', email);
    const axios = require('axios');
    let loginJson = null;
    try {
      const r = await axios.post(`${BASE}/api/auth/jwt/login`, { email, password }, { timeout: 8000 });
      loginJson = r.data;
      console.log('Login status:', r.status, 'body:', JSON.stringify(loginJson));
    } catch (err) {
      console.error('Login error dump:', util.inspect(err, { depth: 5 }));
      if (err.response) {
        console.error('Login failed status:', err.response.status, 'body:', JSON.stringify(err.response.data));
      } else {
        console.error('Login request error:', err.message);
      }
      throw new Error('Login failed: ' + (err && err.message ? err.message : String(err)));
    }
    const token = loginJson.accessToken || loginJson.token || (loginJson.data && loginJson.data.accessToken);
    console.log('Got token (first 24):', token && token.slice(0,24));

    // Upload KYC (use curl to avoid multipart incompatibility in Node fetch)
    console.log('Uploading KYC file via curl');
    const { execSync } = require('child_process');
    let publicId = null;
    try {
      const curlPath = kycFile.replace(/\\/g, '/');
      const curlCmd = `curl -s -F "documents=@${curlPath}" -H "Authorization: Bearer ${token}" "${BASE}/api/upload/vendor/kyc?debug=true"`;
      const curlOut = execSync(curlCmd, { encoding: 'utf8' });
      let uploadJson = null;
      try { uploadJson = curlOut ? JSON.parse(curlOut) : null; } catch (e) { uploadJson = null; }
      console.log('Upload response raw:', curlOut);
      console.log('Upload parsed success:', uploadJson && uploadJson.success === true);
      if (!uploadJson || !uploadJson.success) throw new Error('Upload failed: ' + (curlOut || 'no response'));
      const uploaded = uploadJson.data && (uploadJson.data.uploaded || uploadJson.data) || uploadJson.uploaded || [];
      const first = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      publicId = first && (first.publicId || first.public_id || (first.url && String(first.url).split('/').pop()));
      console.log('Uploaded publicId:', publicId);
    } catch (err) {
      throw new Error('Upload failed: ' + (err && err.message ? err.message : String(err)));
    }

    // Delete the uploaded file
    console.log('Deleting uploaded file, publicId:', publicId);
    const delRes = await fetch(`${BASE}/api/upload/delete-multiple`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ publicIds: [publicId], resourceType: 'raw' }) });
    const delText = await delRes.text().catch(() => '');
    let delJson = null; try { delJson = delText ? JSON.parse(delText) : null; } catch (e) { delJson = null; }
    console.log('Delete status:', delRes.status, 'body:', delText);

    // Fetch /me
    console.log('Fetching /auth/jwt/me');
    const meRes = await fetch(`${BASE}/api/auth/jwt/me`, { headers: { Authorization: `Bearer ${token}` } });
    const meText = await meRes.text().catch(() => '');
    let meJson = null; try { meJson = meText ? JSON.parse(meText) : null; } catch (e) { meJson = null; }
    console.log('/me status:', meRes.status, 'body:', meText);

    console.log('E2E auth flow complete');
  } catch (e) {
    console.error('E2E failed:', e && (e.message || e));
    process.exit(2);
  }
})();
