const fs = require('fs');
const path = require('path');
const markdownDocx = require('markdown-docx');

async function convertToWord() {
  try {
    const inputFile = path.join(__dirname, 'PROPERTY_ARK_APP_HANDOVER_DOCUMENT.md');
    const outputFile = path.join(__dirname, 'PROPERTY_ARK_APP_HANDOVER_DOCUMENT.docx');
    
    console.log('Reading markdown file...');
    const markdownContent = fs.readFileSync(inputFile, 'utf8');
    
    console.log('Converting to Word document...');
    await markdownDocx(markdownContent, outputFile);
    
    console.log('✅ Word document created successfully!');
    console.log(`📄 File saved to: ${outputFile}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Trying alternative method...');
    
    // Fallback: Use a simpler approach
    try {
      const { execSync } = require('child_process');
      // Try using pandoc if available via npm
      execSync(`npx --yes @pandoc/convert PROPERTY_ARK_APP_HANDOVER_DOCUMENT.md -o PROPERTY_ARK_APP_HANDOVER_DOCUMENT.docx`, {
        stdio: 'inherit'
      });
    } catch (fallbackError) {
      console.error('Fallback also failed. Please install pandoc or use an online converter.');
      console.error('Alternative: Use online tool like https://www.markdowntoword.com/');
    }
  }
}

convertToWord();

