const fs = require('fs');
const p = process.argv[2] || 'src/pages/Profile.js';
const txt = fs.readFileSync(p,'utf8');
const counts = {};
for (const ch of ['{','}','<','>','\n']) counts[ch]=0;
for (const c of txt) if (counts[c]!==undefined) counts[c]++;
console.log('counts',counts);
