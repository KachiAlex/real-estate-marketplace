const fetch = global.fetch || require('node-fetch');
(async()=>{
  const base = process.argv[2] || 'https://real-estate-marketplace-1-k8jp.onrender.com';
  try{
    const regRes = await fetch(base + '/api/auth/register', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email:'smoke.token.'+Date.now()+'@example.com', password:'UploadCloud123!', firstName:'Token', lastName:'User', roles:['user']})});
    const regJson = await regRes.json().catch(()=>null);
    if(!regRes.ok){console.error('register failed',regRes.status,JSON.stringify(regJson)); process.exit(1);} 
    const token = regJson.token || regJson.accessToken || (regJson.data && regJson.data.accessToken);
    if(!token){console.error('no token',JSON.stringify(regJson)); process.exit(1);} 
    console.log(token);
  }catch(err){console.error(err && err.stack ? err.stack : err); process.exit(1);} 
})();
