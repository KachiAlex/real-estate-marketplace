const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

async function convertMarkdownToWord() {
  try {
    // Read the markdown file
    const markdownContent = fs.readFileSync(
      path.join(__dirname, 'PROPERTY_ARK_APP_HANDOVER_DOCUMENT.md'),
      'utf8'
    );

    // Parse markdown and convert to docx structure
    const lines = markdownContent.split('\n');
    const docElements = [];
    let inCodeBlock = false;
    let codeBlockContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          docElements.push(
            new Paragraph({
              text: codeBlockContent.join('\n'),
              style: 'Code',
              spacing: { after: 200 }
            })
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        docElements.push(
          new Paragraph({
            text: line.substring(2).trim(),
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 }
          })
        );
      } else if (line.startsWith('## ')) {
        docElements.push(
          new Paragraph({
            text: line.substring(3).trim(),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
          })
        );
      } else if (line.startsWith('### ')) {
        docElements.push(
          new Paragraph({
            text: line.substring(4).trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 }
          })
        );
      } else if (line.startsWith('#### ')) {
        docElements.push(
          new Paragraph({
            text: line.substring(5).trim(),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 150, after: 100 }
          })
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points
        docElements.push(
          new Paragraph({
            text: line.substring(2).trim(),
            bullet: { level: 0 },
            spacing: { after: 100 }
          })
        );
      } else if (line.trim() === '') {
        // Empty line
        docElements.push(
          new Paragraph({
            text: '',
            spacing: { after: 100 }
          })
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        const text = line.replace(/\*\*/g, '').trim();
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 150 }
          })
        );
      } else if (line.includes('✅') || line.includes('⚠️')) {
        // Status indicators - keep formatting
        docElements.push(
          new Paragraph({
            text: line.trim(),
            spacing: { after: 100 }
          })
        );
      } else {
        // Regular paragraph
        const text = line.trim();
        if (text) {
          // Handle inline formatting
          const parts = [];
          let currentText = '';
          let inBold = false;
          
          for (let j = 0; j < text.length; j++) {
            if (text[j] === '*' && text[j + 1] === '*') {
              if (currentText) {
                parts.push(new TextRun({ text: currentText, bold: inBold }));
                currentText = '';
              }
              inBold = !inBold;
              j++; // Skip next *
            } else if (text[j] === '`') {
              if (currentText) {
                parts.push(new TextRun({ text: currentText, bold: inBold }));
                currentText = '';
              }
              // Find closing backtick
              let codeText = '';
              j++;
              while (j < text.length && text[j] !== '`') {
                codeText += text[j];
                j++;
              }
              parts.push(new TextRun({ text: codeText, font: 'Courier New' }));
            } else {
              currentText += text[j];
            }
          }
          
          if (currentText) {
            parts.push(new TextRun({ text: currentText, bold: inBold }));
          }

          docElements.push(
            new Paragraph({
              children: parts.length > 0 ? parts : [new TextRun({ text: text })],
              spacing: { after: 100 }
            })
          );
        }
      }
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docElements
        }
      ],
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
              size: 22
            },
            paragraph: {
              spacing: { line: 276, after: 200 }
            }
          },
          heading1: {
            run: {
              font: 'Calibri',
              size: 32,
              bold: true,
              color: '2E75B6'
            },
            paragraph: {
              spacing: { before: 240, after: 120 }
            }
          },
          heading2: {
            run: {
              font: 'Calibri',
              size: 28,
              bold: true,
              color: '2E75B6'
            },
            paragraph: {
              spacing: { before: 200, after: 100 }
            }
          },
          heading3: {
            run: {
              font: 'Calibri',
              size: 24,
              bold: true
            },
            paragraph: {
              spacing: { before: 180, after: 80 }
            }
          }
        }
      }
    });

    // Generate and save the Word document
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, 'PROPERTY_ARK_APP_HANDOVER_DOCUMENT.docx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('✅ Word document created successfully!');
    console.log(`📄 File saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error converting to Word:', error);
    process.exit(1);
  }
}

convertMarkdownToWord();

