// Simple node script to call the admin pending vendors endpoint with a hard-coded token
 (async () => {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMmVkZGU2ZS1jMzk2LTRhZDYtODBhZi01YzJjMTZhYzhkOTQiLCJpYXQiOjE3NzE3MjkyMzgsImV4cCI6MTc3NDMyMTIzOH0.oDdRr-qCfGQCu-Uqn6PsxA_jZVxYiB4FnNCfDU_2BH8';
    const fetchFn = globalThis.fetch || (await import('undici')).fetch;
    const res = await fetchFn('http://localhost:5001/api/admin/vendors/pending', { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });
    const json = await res.json().catch(() => null);
    console.log('ADMIN LIST RESPONSE:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('ADMIN LIST ERROR:', err.message || err);
    process.exitCode = 1;
  }
})();
