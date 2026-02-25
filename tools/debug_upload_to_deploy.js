const fetch = global.fetch || require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

(async()=>{
  const base = process.argv[2] || 'https://real-estate-marketplace-1-k8jp.onrender.com';
  try{
    console.log('Registering test user');
    const regRes = await fetch(base + '/api/auth/register', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email:'smoke.debug.'+Date.now()+'@example.com', password:'UploadCloud123!', firstName:'Debug', lastName:'User', roles:['user']})});
    const regJson = await regRes.json().catch(()=>null);
    if(!regRes.ok){console.error('register failed',regRes.status,JSON.stringify(regJson)); process.exit(1);} 
    const token = regJson.token || regJson.accessToken || (regJson.data && regJson.data.accessToken);
    if(!token){console.error('no token',JSON.stringify(regJson)); process.exit(1);} 

    // prepare a small temp file
    const tmpPath = './tools/tmp-kyc-debug.txt';
    fs.writeFileSync(tmpPath, 'KYC debug file ' + new Date().toISOString());

    console.log('Uploading file to vendor KYC with debug flag');
    const fd = new FormData();
    fd.append('documents', fs.createReadStream(tmpPath));

    // Calculate Content-Length to avoid chunking/truncation issues
    const getLength = () => new Promise((resolve, reject) => fd.getLength((err, length) => err ? reject(err) : resolve(length)));
    let length;
    try {
      length = await getLength();
    } catch (lenErr) {
      console.warn('Could not compute Content-Length, proceeding without it:', lenErr.message || lenErr);
    }

    const headers = Object.assign({}, fd.getHeaders());
    if (length) headers['Content-Length'] = String(length);
    headers['Authorization'] = 'Bearer ' + token;

    let upRes, upJson;
    try {
      console.log('Request headers preview', headers);
      upRes = await fetch(base + '/api/upload/vendor/kyc?debug=true', {method:'POST', headers, body: fd});
      upJson = await upRes.json().catch(()=>null);
      console.log('Upload response status', upRes.status);
      console.log(JSON.stringify(upJson, null, 2));
    } catch (fetchErr) {
      console.error('Upload fetch failed:', fetchErr && (fetchErr.stack || fetchErr.message || String(fetchErr)));
      if (fetchErr && fetchErr.name) console.error('fetch error name:', fetchErr.name);
      process.exit(1);
    }

    // clean up
    try{ fs.unlinkSync(tmpPath);}catch(e){}
  }catch(err){console.error('error',err && err.stack ? err.stack : err);} 
})();
