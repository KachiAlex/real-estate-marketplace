const path = require('path');
const res = require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
console.log('dotenv result', res);
console.log('resolved path', path.resolve(__dirname, '..', '.env'));
console.log('DATABASE_URL=>', process.env.DATABASE_URL);
console.log('DB_USER=>', process.env.DB_USER);
console.log('DB_HOST=>', process.env.DB_HOST);
