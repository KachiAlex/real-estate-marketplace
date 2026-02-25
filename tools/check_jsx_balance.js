const fs = require('fs');
const path = process.argv[2] || 'src/pages/Profile.js';
const text = fs.readFileSync(path, 'utf8');
const openTagRe = /<([A-Za-z][A-Za-z0-9\-]*)\b[^>]*?>/g;
const closeTagRe = /<\/([A-Za-z][A-Za-z0-9\-]*)\s*>/g;
const selfClosingRe = /<([A-Za-z][A-Za-z0-9\-]*)\b[^>]*?\/\s*>/g;
let m; const opens = {}; const closes = {};
while ((m = openTagRe.exec(text))) {
  const tag = m[1];
  opens[tag] = (opens[tag] || 0) + 1;
}
while ((m = closeTagRe.exec(text))) {
  const tag = m[1];
  closes[tag] = (closes[tag] || 0) + 1;
}
while ((m = selfClosingRe.exec(text))) {
  const tag = m[1];
  // treat self-closing as both open and close
  opens[tag] = (opens[tag] || 0) + 1;
  closes[tag] = (closes[tag] || 0) + 1;
}
const tags = new Set([...Object.keys(opens), ...Object.keys(closes)]);
console.log('Tag counts for', path);
for (const t of Array.from(tags).sort()) {
  console.log(t, 'open=', opens[t]||0, 'close=', closes[t]||0);
}
