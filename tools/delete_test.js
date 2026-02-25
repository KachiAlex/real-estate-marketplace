const fetch = global.fetch || require('node-fetch');
const [,, publicId, base = 'http://localhost:5001'] = process.argv;
if (!publicId) { console.error('Usage: node delete_test.js <publicId> [baseUrl]'); process.exit(2); }
(async () => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.MOCK_EMAIL) headers['X-Mock-User-Email'] = process.env.MOCK_EMAIL;
    const resp = await fetch(`${base}/api/upload/delete-multiple`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ publicIds: [publicId], resourceType: 'raw' })
    });
    const data = await resp.json().catch(() => null);
    console.log('Status:', resp.status);
    console.log('Body:', data);
  } catch (e) {
    console.error('Error:', e && (e.message || e));
    process.exit(3);
  }
})();
