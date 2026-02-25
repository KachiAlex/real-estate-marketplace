const fetch = global.fetch || require('node-fetch');
const FormData = require('form-data');

(async()=>{
  const base='https://real-estate-marketplace-1-k8jp.onrender.com';
  try{
    const regRes=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'smoke.cloud.'+Date.now()+'@example.com',password:'UploadCloud123!',firstName:'Cloud',lastName:'Test',roles:['user']})});
    const regJson=await regRes.json().catch(()=>null);
    if(!regRes.ok){console.error('register failed',regRes.status,JSON.stringify(regJson)); process.exit(1);} 
    const token=regJson.token||regJson.accessToken||(regJson.data&&regJson.data.accessToken);
    if(!token){console.error('no token',JSON.stringify(regJson)); process.exit(1);} 
    const signedRes=await fetch(base+'/api/upload/vendor/kyc/signed',{headers:{authorization:'Bearer '+token}});
    const signedJson=await signedRes.json().catch(()=>null);
    if(!signedRes.ok){console.error('signed failed',signedRes.status,JSON.stringify(signedJson)); process.exit(1);} 
    const data=signedJson.data||signedJson;
    console.log('signed data',JSON.stringify(data));
    const cloudName = data.cloud_name || data.cloudName;
    const apiKey = data.api_key;
    const timestamp = data.timestamp;
    const signature = data.signature;
    const uploadUrl = 'https://api.cloudinary.com/v1_1/'+cloudName+'/auto/upload';
    const fd = new FormData();
    fd.append('file', Buffer.from('Direct Cloudinary test content'), {filename:'kyc-direct.txt', contentType:'text/plain'});
    fd.append('api_key', apiKey);
    fd.append('timestamp', String(timestamp));
    fd.append('signature', signature);
    console.log('posting to',uploadUrl);
    const upRes=await fetch(uploadUrl,{method:'POST',headers:fd.getHeaders(),body:fd});
    const upText=await upRes.text().catch(()=>null);
    console.log('cloudinary status',upRes.status,'body',upText);
  }catch(err){console.error('error',err && err.stack ? err.stack : err);} 
})();
