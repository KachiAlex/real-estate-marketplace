const http = require('http');

const url = process.argv[2] || 'http://localhost:5001/api/health';
const maxAttempts = parseInt(process.argv[3], 10) || 20;
const delayMs = parseInt(process.argv[4], 10) || 3000;

async function check() {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(url, (r) => {
          let d = '';
          r.on('data', (c) => d += c);
          r.on('end', () => resolve({ statusCode: r.statusCode, body: d }));
        });
        req.on('error', reject);
      });
      console.log('HEALTH OK', res.statusCode, res.body);
      process.exit(0);
    } catch (e) {
      console.error('health try', i+1, 'failed:', e.message || e);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.error('health check failed after attempts');
  process.exit(2);
}

check();
