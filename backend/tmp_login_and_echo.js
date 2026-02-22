const [,, apiBase, email, password] = process.argv;
if (!apiBase || !email || !password) {
  console.error('Usage: node tmp_login_and_echo.js <apiBase> <email> <password>');
  process.exit(1);
}
(async ()=>{
  try {
    const fetchFn = global.fetch || (await import('node:undici')).fetch;
    const res = await fetchFn(`${apiBase.replace(/\/$/, '')}/api/auth/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const j = await res.json().catch(()=>null);
    console.log(JSON.stringify(j));
  } catch(e) { console.error('ERR', e); process.exit(1); }
})();
