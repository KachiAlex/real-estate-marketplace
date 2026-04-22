(async function(){
  const pth = require('path');
  require('dotenv').config({ path: pth.resolve(__dirname, '..', '.env') });
  const fetch = global.fetch || ((...a) => import('node:undici').then(m => m.fetch(...a)));

  const API_BASE = process.argv[2] || process.env.API_BASE || 'http://localhost:5001';
  const ADMIN_EMAIL = process.argv[3] || process.env.ADMIN_FALLBACK_EMAIL || 'admin@propertyark.com';
  const ADMIN_PASSWORD = process.argv[4] || process.env.ADMIN_FALLBACK_PASSWORD || 'admin123';

  async function login(email, password) {
    const loginPaths = ['/api/auth/jwt/login', '/api/auth/login'];
    for (const p of loginPaths) {
      try {
        const res = await fetch(API_BASE.replace(/\/$/, '') + p, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) continue;
        const j = await res.json();
        const token = j.accessToken || j.token || j.jwt || j.id_token;
        return { token, user: j.user || j };
      } catch (e) {
        // try next
      }
    }
    throw new Error('Login failed');
  }

  function unwrapData(body) {
    if (!body) return null;
    if (Array.isArray(body)) return body;
    if (body.data) return body.data;
    const fetch = global.fetch || ((...a)=>import('node:undici').then(m=>m.fetch(...a)));
    const path = require('path');
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

    const API_BASE = process.argv[2] || process.env.API_BASE || 'http://localhost:5001';
    const ADMIN_EMAIL = process.env.ADMIN_FALLBACK_EMAIL || 'admin@propertyark.com';
    const ADMIN_PASSWORD = process.env.ADMIN_FALLBACK_PASSWORD || 'admin123';

    async function safeJson(res){ try { return await res.json(); } catch(e){ return null } }

    async function login(email,password){
      const paths = ['/api/auth/jwt/login','/api/auth/login'];
      for(const p of paths){
        try{
          const res = await fetch(API_BASE.replace(/\/$/,'')+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
          if(!res.ok) continue;
          const j = await safeJson(res);
          const token = j && (j.accessToken||j.token||j.jwt||j.id_token);
          return { token, body: j };
        }catch(e){ /* try next */ }
      }
      throw new Error('login failed');
    }

    function unwrap(body){ if(!body) return null; if(Array.isArray(body)) return body; if(body.data) return body.data; return body }

    async function run(){
      console.log('API_BASE', API_BASE);
      const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('admin token (trunc):', (adminLogin.token||'').slice(0,40)+'...');
      const hdr = { 'Authorization': `Bearer ${adminLogin.token}`, 'Content-Type':'application/json' };

      // get a property
      const propsRaw = await fetch(`${API_BASE}/api/properties`).catch(()=>null);
      const propsBody = propsRaw? await safeJson(propsRaw) : null;
      const props = unwrap(propsBody) || [];
      if(props.length===0){ console.log('no properties found, abort'); return }
      const property = props[0];
      const propertyId = property.id || property.uuid || property._id || property.propertyId;
      console.log('picked property id', propertyId);

      // try to create verification application using admin token (may or may not be allowed)
      const createResp = await fetch(`${API_BASE}/api/verification/applications`,{ method:'POST', headers: hdr, body: JSON.stringify({ propertyId, notes: 'smoke test' }) }).catch(()=>null);
      const createJson = createResp? await safeJson(createResp) : null;
      console.log('create status:', createResp?createResp.status:'no-response');
      console.log('create body:', createJson);

      // list applications as admin
      const listResp = await fetch(`${API_BASE}/api/verification/applications`,{ method:'GET', headers: hdr }).catch(()=>null);
      const listJson = listResp? await safeJson(listResp) : null;
      const list = unwrap(listJson) || [];
      console.log('applications count (admin view):', list.length);

      // pick app id to approve
      let appId = null;
      if(list.length>0) appId = list[0].id || (list[0].data && list[0].data.id);
      if(!appId && createJson) appId = createJson.id || (createJson.data && createJson.data.id);

      if(!appId){ console.log('no application id to approve; exiting'); return }
      console.log('approving app id', appId);
      const patchResp = await fetch(`${API_BASE}/api/verification/applications/${appId}/status`,{ method:'PATCH', headers: hdr, body: JSON.stringify({ status:'approved', adminNotes:'approved by smoke script' }) }).catch(()=>null);
      const patchJson = patchResp? await safeJson(patchResp) : null;
      console.log('patch status:', patchResp?patchResp.status:'no-response', 'body:', patchJson);

      // check notifications for admin
      const notesResp = await fetch(`${API_BASE}/api/notifications`,{ method:'GET', headers: hdr }).catch(()=>null);
      const notesJson = notesResp? await safeJson(notesResp) : null;
      console.log('notifications (admin):', unwrap(notesJson));
    }

    run().catch(e=>{ console.error('smoke failed:', e && e.message || e); process.exit(1) });
