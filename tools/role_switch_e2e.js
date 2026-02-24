const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g,'');
    const email = `e2e-role-${ts}@example.com`;
    const registerBody = { email, password: 'Passw0rd!', firstName: 'E2E', lastName: 'Role', buyer: true, vendor: true };

    console.log('Registering', email);
    const reg = await fetch('http://localhost:5001/api/auth/jwt/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerBody) });
    const regJson = await reg.json().catch(() => null);
    if (!reg.ok) {
      console.error('Register failed', reg.status, regJson);
      process.exit(2);
    }
    let token = regJson.accessToken || regJson.token;
    if (!token) {
      console.error('No access token returned on register');
      process.exit(3);
    }
    console.log('Registered OK, token received (len)', token.length);

    const doSwitch = async (role) => {
      console.log('Switching to', role);
      const resp = await fetch('http://localhost:5001/api/auth/jwt/switch-role', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ role }) });
      const j = await resp.json().catch(() => null);
      if (!resp.ok) { console.error('Switch failed', resp.status, j); return { ok: false }; }
      // update token if provided
      token = j.accessToken || token;
      return { ok: true, body: j };
    };

    const fetchMe = async () => {
      const me = await fetch('http://localhost:5001/api/auth/jwt/me', { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      const mj = await me.json().catch(() => null);
      return { ok: me.ok, body: mj };
    };

    const s1 = await doSwitch('vendor');
    if (!s1.ok) { console.error('Switch to vendor failed'); process.exit(4); }
    const me1 = await fetchMe();
    if (!me1.ok) { console.error('/me after vendor switch failed', me1.body); process.exit(5); }
    console.log('/me after vendor switch:', me1.body.user || me1.body);
    const active1 = (me1.body.user && me1.body.user.activeRole) || (me1.body.activeRole) || (me1.body.user && me1.body.user.role);
    if (active1 !== 'vendor') { console.error('Expected activeRole vendor but got', active1); process.exit(6); }

    const s2 = await doSwitch('user');
    if (!s2.ok) { console.error('Switch back to user failed'); process.exit(7); }
    const me2 = await fetchMe();
    if (!me2.ok) { console.error('/me after user switch failed', me2.body); process.exit(8); }
    console.log('/me after user switch:', me2.body.user || me2.body);
    const active2 = (me2.body.user && me2.body.user.activeRole) || (me2.body.activeRole) || (me2.body.user && me2.body.user.role);
    if (active2 !== 'user') { console.error('Expected activeRole user but got', active2); process.exit(9); }

    console.log('ROLE SWITCH E2E PASSED');
    process.exit(0);
  } catch (e) {
    console.error('E2E error', e);
    process.exit(1);
  }
})();
