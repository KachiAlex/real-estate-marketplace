const { execSync } = require('child_process');
const path = require('path');

const API_BASE = process.argv[2] || 'http://localhost:5001';
const tmpFile = path.join(__dirname, 'tmp-kyc-debug.txt');

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return out.trim();
  } catch (e) {
    console.error('Command failed:', cmd);
    console.error(e.stdout && e.stdout.toString());
    console.error(e.stderr && e.stderr.toString());
    throw e;
  }
}

(async () => {
  try {
    const email = `smoke+${Date.now()}@example.com`;
    const password = 'Passw0rd!';
    console.log('Registering test user', email);

    const regCmd = `curl.exe -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Vendor', roles: ['vendor'] })}' ${API_BASE}/api/auth/jwt/register`;
    const regOut = run(regCmd);
    const regJson = JSON.parse(regOut || '{}');
    console.log('Register response:', regJson.success === false ? regJson : 'OK');

    const token = regJson.accessToken || regJson.token || (regJson.data && regJson.data.accessToken) || null;
    if (!token) {
      console.error('No access token returned from register — trying login');
      const loginCmd = `curl.exe -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify({ email, password })}' ${API_BASE}/api/auth/jwt/login`;
      const loginOut = run(loginCmd);
      const loginJson = JSON.parse(loginOut || '{}');
      console.log('Login response:', loginJson.success === false ? loginJson : 'OK');
      if (!loginJson.accessToken && !loginJson.token) throw new Error('Login failed to produce token');
      token = loginJson.accessToken || loginJson.token;
    }

    console.log('Using token (first 24 chars):', token && token.slice(0, 24));

    // Upload a small file
    console.log('Uploading KYC file (temp)');
    const uploadCmd = `curl.exe -s -F "documents=@${tmpFile}" -H "Authorization: Bearer ${token}" ${API_BASE}/api/upload/vendor/kyc?debug=true`;
    const uploadOut = run(uploadCmd);
    let uploadJson = {};
    try { uploadJson = JSON.parse(uploadOut || '{}'); } catch (e) { console.warn('Upload parse failed, output:', uploadOut); }
    console.log('Upload response:', uploadJson.success === false ? uploadJson : 'OK');

    const uploaded = uploadJson.data && (uploadJson.data.uploaded || uploadJson.data.uploaded || uploadJson.data.uploaded) || uploadJson.data || uploadJson.uploaded || [];
    const first = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const publicId = first && (first.publicId || first.public_id || first.publicID || first.filename || first.url && String(first.url).split('/').pop());
    console.log('Detected publicId/url fragment:', publicId);

    if (!publicId) {
      console.warn('No publicId found — aborting delete step');
    } else {
      console.log('Deleting uploaded doc via delete-multiple');
      const deletePayload = JSON.stringify({ publicIds: [publicId], resourceType: 'raw' });
      const delCmd = `curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${deletePayload}' ${API_BASE}/api/upload/delete-multiple`;
      const delOut = run(delCmd);
      const delJson = JSON.parse(delOut || '{}');
      console.log('Delete response:', delJson);
    }

    console.log('Fetching /auth/jwt/me to verify user state');
    const meCmd = `curl.exe -s -H "Authorization: Bearer ${token}" ${API_BASE}/api/auth/jwt/me`;
    const meOut = run(meCmd);
    const meJson = JSON.parse(meOut || '{}');
    console.log('Me response:', meJson);

    console.log('Done.');
  } catch (e) {
    console.error('Test failed:', e && (e.message || e));
    process.exit(2);
  }
})();
