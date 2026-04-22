const https = require('https');
const http = require('http');

async function testLogin(endpoint) {
  const postData = JSON.stringify({
    email: 'admin@propertyark.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`\n=== ${endpoint} ===`);
          console.log('Response status:', res.statusCode);
          console.log('Response body:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log(`\n=== ${endpoint} ===`);
          console.log('Response status:', res.statusCode);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testAllLogins() {
  try {
    await testLogin('/api/auth/login');
    await testLogin('/api/auth/jwt/login');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAllLogins();
