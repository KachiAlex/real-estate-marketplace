const { execSync } = require('child_process');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
  } catch (e) {
    console.error('Command failed:', cmd);
    console.error(e.stdout && e.stdout.toString());
    console.error(e.stderr && e.stderr.toString());
    throw e;
  }
}

(async () => {
  const base = 'http://localhost:5001';
  const email = `smoke+${Date.now()}@example.com`;
  const password = 'Test1234!';
  console.log('Registering test user', email);
  const regPayload = JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Tester', roles: ['vendor'] });
  // Try the jwt register path first, then fallback to legacy /auth/register
  let regOut = null;
  try {
    const regCmd1 = `curl.exe -s -X POST -H "Content-Type: application/json" -d '${regPayload.replace(/'/g, "'\\''")}' ${base}/api/auth/jwt/register`;
    regOut = run(regCmd1);
  } catch (e) {
    const regCmd2 = `curl.exe -s -X POST -H "Content-Type: application/json" -d '${regPayload.replace(/'/g, "'\\''")}' ${base}/api/auth/register`;
    regOut = run(regCmd2);
  }
  let regJson = null;
  try { regJson = JSON.parse(regOut); } catch (e) { console.error('Register output JSON parse failed:', regOut); process.exit(1); }
  console.log('Register response:', JSON.stringify(regJson).slice(0, 800));

  // find token
  const token = (regJson && (regJson.accessToken || regJson.token || (regJson.data && (regJson.data.accessToken || regJson.data.token)) || (regJson.data && regJson.data.token))) || (regJson && regJson.data && regJson.data.token) || null;
  if (!token) {
    // Try common alternate shapes
    const maybe = regJson && regJson.data && regJson.data.accessToken ? regJson.data.accessToken : (regJson.accessToken || regJson.token);
    if (maybe) {
      console.log('Found token (alt)');
    }
  }
  const finalToken = token || (regJson && regJson.data && (regJson.data.accessToken || regJson.data.token)) || regJson && (regJson.accessToken || regJson.token) || null;
  if (!finalToken) { console.error('No access token returned; aborting.'); process.exit(1); }
  console.log('Access token acquired (truncated):', finalToken.slice(0, 12) + '...');

  // Upload a test KYC file
  const filePath = path.resolve(__dirname, 'tmp-kyc-debug.txt');
  console.log('Uploading test file:', filePath);
  const uploadCmd = `curl.exe -s -F "documents=@${filePath}" -H "Authorization: Bearer ${finalToken}" ${base}/api/upload/vendor/kyc?debug=true`;
  const uploadOut = run(uploadCmd);
  let uploadJson = null;
  try { uploadJson = JSON.parse(uploadOut); } catch (e) { console.error('Upload output JSON parse failed:', uploadOut); process.exit(1); }
  console.log('Upload response:', JSON.stringify(uploadJson).slice(0, 1000));

  const uploaded = (uploadJson && uploadJson.data && uploadJson.data.uploaded) || uploadJson && uploadJson.data || uploadJson && uploadJson.uploaded || null;
  if (!uploaded || (Array.isArray(uploaded) && uploaded.length === 0)) {
    console.error('No uploaded files found in response');
    process.exit(1);
  }
  const first = Array.isArray(uploaded) ? uploaded[0] : (uploaded.uploaded && uploaded.uploaded[0]) || uploaded[0];
  const publicId = first.publicId || first.public_id || first.filename || first.url && String(first.url).split('/').pop().replace(/\.[^.]+$/, '') || null;
  console.log('Uploaded publicId detected:', publicId);

  // Call delete-multiple
  console.log('Deleting uploaded file via /api/upload/delete-multiple');
  const delPayload = JSON.stringify({ publicIds: [publicId], resourceType: first.resourceType || 'raw' });
  const delCmd = `curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${finalToken}" -d '${delPayload.replace(/'/g, "'\\''")}' ${base}/api/upload/delete-multiple`;
  const delOut = run(delCmd);
  let delJson = null;
  try { delJson = JSON.parse(delOut); } catch (e) { console.error('Delete output JSON parse failed:', delOut); process.exit(1); }
  console.log('Delete response:', JSON.stringify(delJson).slice(0,1000));

  // Fetch current user
  console.log('Fetching /auth/jwt/me');
  const meCmd = `curl.exe -s -H "Authorization: Bearer ${finalToken}" ${base}/api/auth/jwt/me`;
  const meOut = run(meCmd);
  let meJson = null;
  try { meJson = JSON.parse(meOut); } catch (e) { console.error('Me output JSON parse failed:', meOut); process.exit(1); }
  console.log('Me response (truncated):', JSON.stringify(meJson).slice(0,1200));

  console.log('\nTest completed. Check that `vendorData.kycDocs` no longer references the deleted publicId and that roles include vendor but activeRole was not changed by upload.');
})();
