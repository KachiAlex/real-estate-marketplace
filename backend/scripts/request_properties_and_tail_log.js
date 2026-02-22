const http = require('http');
const fs = require('fs');
const url = 'http://localhost:5001/api/properties';

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
      if (fs.existsSync('server_error.log')) {
        const tail = fs.readFileSync('server_error.log', 'utf8').split('\n').slice(-200).join('\n');
        console.log('\n---- server_error.log tail ----\n');
        console.log(tail);
      } else {
        console.log('\nserver_error.log not found');
      }
    } catch (e) {
      console.error('Failed to read server_error.log', e.message);
    }
  });
}).on('error', (err) => {
  console.error('REQUEST ERROR', err.message);
  try {
    if (fs.existsSync('server_error.log')) {
      const tail = fs.readFileSync('server_error.log', 'utf8').split('\n').slice(-200).join('\n');
      console.log('\n---- server_error.log tail ----\n');
      console.log(tail);
    } else {
      console.log('\nserver_error.log not found');
    }
  } catch (e) {
    console.error('Failed to read server_error.log', e.message);
  }
});
