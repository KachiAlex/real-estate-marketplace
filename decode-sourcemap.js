const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

async function decodeSourceMap() {
  try {
    const mapPath = './build/static/js/7431.2232a240.chunk.js.map';
    const mapContent = fs.readFileSync(mapPath, 'utf8');
    
    // The error trace shows position around 78226 in the original error
    // Let's try a few positions around that area and search for 'Zs'
    const consumer = await new SourceMapConsumer(JSON.parse(mapContent));
    
    // Search through the source map for references to chart.js or reactjs-2
    const sources = consumer.sources;
    console.log('Sources in this chunk:');
    sources.forEach((source, idx) => {
      console.log(`  [${idx}] ${source}`);
    });
    
    // Try to find the actual position of the error by looking at the chunk file
    const chunkPath = './build/static/js/7431.2232a240.chunk.js';
    const chunkContent = fs.readFileSync(chunkPath, 'utf8');
    
    // Search for "Zs" in the chunk
    const zsMatch = chunkContent.match(/Zs\b/);
    if (zsMatch) {
      const pos = chunkContent.indexOf(zsMatch[0]);
      console.log(`\n\nFound "Zs" at position: ${pos}`);
      
      // Get a small snippet around it
      const start = Math.max(0, pos - 150);
      const end = Math.min(chunkContent.length, pos + 150);
      const context = chunkContent.substring(start, end);
      console.log('\nContext around "Zs":');
      console.log(context.replace(/Zs/g, '>>Zs<<'));
      
      // Convert byte position to line:column to use with source map
      const precedingText = chunkContent.substring(0, pos);
      let line = 1, column = 0;
      for (let i = 0; i < precedingText.length; i++) {
        if (precedingText[i] === '\n') {
          line++;
          column = 0;
        } else {
          column++;
        }
      }
      console.log(`\nPosition: line ${line}, column ${column}`);
      
      // Get original position
      const original = consumer.originalPositionFor({
        line: line,
        column: column
      });
      
      console.log('\n✓ Original Source Mapping:');
      console.log(`  Source: ${original.source}`);
      console.log(`  Line: ${original.line}`);
      console.log(`  Column: ${original.column}`);
      console.log(`  Name: ${original.name}`);
      
      // Read the original source file to show context
      if (original.source && original.line) {
        const sourcePath = `./build/${original.source}`;
        // Try multiple possible paths
        let foundPath = null;
        const possiblePaths = [
          `./src/${original.source.split('/').slice(-1)[0]}`,
          `./src/components/${original.source.split('/').slice(-1)[0]}`,
          `./src/lib/${original.source.split('/').slice(-1)[0]}`,
          `./src/pages/${original.source.split('/').slice(-1)[0]}`
        ];
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            foundPath = p;
            break;
          }
        }
        
        if (foundPath) {
          const sourceContent = fs.readFileSync(foundPath, 'utf8');
          const lines = sourceContent.split('\n');
          console.log('\n✓ Original Source Code:');
          for (let i = Math.max(0, original.line - 3); i < Math.min(lines.length, original.line + 2); i++) {
            const marker = i === original.line - 1 ? '>>> ' : '    ';
            console.log(`${marker}${i + 1}: ${lines[i]}`);
          }
        }
      }
    } else {
      console.log('Could not find "Zs" in chunk file');
    }
    
    consumer.destroy();
  } catch (err) {
    console.error('Error decoding source map:', err.message);
  }
}

decodeSourceMap();
