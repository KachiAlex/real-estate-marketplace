const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const uploadService = require('../services/uploadService');

async function main(){
  const filePath = path.join(__dirname, 'tmp_upload_test.txt');
  const stat = await fs.stat(filePath);
  const file = {
    path: filePath,
    mimetype: 'text/plain',
    originalname: 'tmp_upload_test.txt',
    size: stat.size
  };

  try{
    const res = await uploadService.uploadMultipleFiles([file], 'documents', { folder: 'vendor/kyc' });
    console.log('uploadMultipleFiles result:', JSON.stringify(res, null, 2));
  }catch(e){
    console.error('uploadMultipleFiles error:', e.message || e);
  }
}

main();
