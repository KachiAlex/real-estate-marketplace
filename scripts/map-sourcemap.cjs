const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

async function map(mapPath, line, column) {
  const raw = fs.readFileSync(mapPath, 'utf8');
  const sm = await new SourceMapConsumer(JSON.parse(raw));
  const pos = sm.originalPositionFor({ line: Number(line), column: Number(column) });
  console.log('Mapped position:', pos);
  if (pos.source) {
    const sourceRoot = sm.sourceRoot || '';
    const sourcePath = sourceRoot ? sourceRoot + pos.source : pos.source;
    try {
      const content = sm.sourceContentFor(pos.source, true);
      if (content) {
        const srcLines = content.split('\n');
        const start = Math.max(0, pos.line - 3);
        const end = Math.min(srcLines.length, pos.line + 2);
        console.log('\n--- Source context ---');
        for (let i = start; i < end; i++) {
          const ln = i + 1;
          console.log((ln === pos.line ? '>' : ' ') + ln.toString().padStart(4) + '| ' + srcLines[i]);
        }
      }
    } catch (e) {
      // ignore
    }
  }
  sm.destroy();
}

if (require.main === module) {
  const [,, mapPath, line, column] = process.argv;
  if (!mapPath || !line || !column) {
    console.error('Usage: node map-sourcemap.cjs <map-file> <line> <column>');
    process.exit(2);
  }
  map(mapPath, line, column).catch(err => { console.error(err); process.exit(1); });
}
