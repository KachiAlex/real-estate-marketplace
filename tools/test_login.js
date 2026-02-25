const axios = require('axios');
(async () => {
  try {
    const res = await axios.post(process.argv[2] || 'http://localhost:5001/api/auth/jwt/login', {
      email: process.argv[3] || 'smoke.e2e@example.com',
      password: process.argv[4] || 'Passw0rd!'
    }, { timeout: 5000 });
    console.log('status', res.status);
    console.log('body', JSON.stringify(res.data));
  } catch (e) {
    if (e.response) {
      console.error('status', e.response.status);
      console.error('body', e.response.data);
    } else {
      console.error('error', e.message);
    }
    process.exit(2);
  }
})();
