const http = require('http');
const fs = require('fs');
const url = 'http://localhost:5001/api/properties?debug=true';

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('BODY', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('BODY', data);
    }

    try {
      const tail = fs.readFileSync('server.log', 'utf8').split('\n').slice(-400).join('\n');
      console.log('\n---- server.log tail ----\n');
      console.log(tail);
    } catch (e) {
      console.error('Failed to read server.log', e.message);
    }
  });
}).on('error', (err) => {
  console.error('REQUEST ERROR', err.message);
  try {
    const tail = fs.readFileSync('server.log', 'utf8').split('\n').slice(-400).join('\n');
    console.log('\n---- server.log tail ----\n');
    console.log(tail);
  } catch (e) {
    console.error('Failed to read server.log', e.message);
  }
});
