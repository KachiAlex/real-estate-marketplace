const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push({
          type: 'code',
          content: codeBlockLines.join('\n'),
          language: codeBlockLang
        });
        codeBlockLines = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = line.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Skip horizontal rules
    if (trimmed === '---' || trimmed.match(/^={3,}$/)) {
      elements.push({ type: 'separator' });
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', text: line.substring(2).trim() });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', text: line.substring(3).trim() });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', text: line.substring(4).trim() });
    } else if (line.startsWith('#### ')) {
      elements.push({ type: 'h4', text: line.substring(5).trim() });
    } else if (line.startsWith('##### ')) {
      elements.push({ type: 'h5', text: line.substring(6).trim() });
    } else if (line.startsWith('###### ')) {
      elements.push({ type: 'h6', text: line.substring(7).trim() });
    }
    // Lists
    else if (line.match(/^[-*+]\s/)) {
      const text = line.replace(/^[-*+]\s/, '').trim();
      elements.push({ type: 'bullet', text, level: 0 });
    } else if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '').trim();
      elements.push({ type: 'number', text, level: 0 });
    }
    // Empty line
    else if (trimmed === '') {
      elements.push({ type: 'empty' });
    }
    // Regular paragraph
    else if (trimmed) {
      elements.push({ type: 'paragraph', text: line });
    }
  }

  return elements;
}

function createTextRuns(text) {
  const runs = [];
  let currentText = '';
  let inBold = false;
  let inCode = false;

  for (let i = 0; i < text.length; i++) {
    // Handle code backticks
    if (text[i] === '`' && !inCode) {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, bold: inBold }));
        currentText = '';
      }
      inCode = true;
      continue;
    } else if (text[i] === '`' && inCode) {
      if (currentText) {
        runs.push(new TextRun({ 
          text: currentText, 
          font: 'Courier New',
          size: 20
        }));
        currentText = '';
      }
      inCode = false;
      continue;
    }

    // Handle bold
    if (text[i] === '*' && text[i + 1] === '*' && !inCode) {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, bold: inBold, font: inCode ? 'Courier New' : undefined }));
        currentText = '';
      }
      inBold = !inBold;
      i++; // Skip next *
      continue;
    }

    currentText += text[i];
  }

  if (currentText) {
    runs.push(new TextRun({ 
      text: currentText, 
      bold: inBold,
      font: inCode ? 'Courier New' : undefined
    }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

async function convertMarkdownToWord() {
  try {
    console.log('Reading markdown file...');
    const markdownContent = fs.readFileSync(
      path.join(__dirname, 'PROPERTY_ARK_APP_HANDOVER_DOCUMENT.md'),
      'utf8'
    );

    console.log('Parsing markdown...');
    const elements = parseMarkdown(markdownContent);

    console.log('Creating Word document structure...');
    const docElements = [];

    for (const elem of elements) {
      switch (elem.type) {
        case 'h1':
          docElements.push(
            new Paragraph({
              text: elem.text,
              heading: HeadingLevel.TITLE,
              spacing: { after: 400, before: 200 }
            })
          );
          break;

        case 'h2':
          docElements.push(
            new Paragraph({
              text: elem.text,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300, before: 200 }
            })
          );
          break;

        case 'h3':
          docElements.push(
            new Paragraph({
              text: elem.text,
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 150 }
            })
          );
          break;

        case 'h4':
          docElements.push(
            new Paragraph({
              text: elem.text,
              heading: HeadingLevel.HEADING_3,
              spacing: { after: 150, before: 100 }
            })
          );
          break;

        case 'bullet':
          const bulletRuns = createTextRuns(elem.text);
          docElements.push(
            new Paragraph({
              children: bulletRuns,
              bullet: { level: elem.level || 0 },
              spacing: { after: 100 }
            })
          );
          break;

        case 'number':
          const numberRuns = createTextRuns(elem.text);
          docElements.push(
            new Paragraph({
              children: numberRuns,
              numbering: {
                reference: 'default-numbering',
                level: elem.level || 0
              },
              spacing: { after: 100 }
            })
          );
          break;

        case 'code':
          docElements.push(
            new Paragraph({
              text: elem.content,
              style: 'Code',
              spacing: { after: 200, before: 200 }
            })
          );
          break;

        case 'separator':
          docElements.push(
            new Paragraph({
              text: '─'.repeat(50),
              alignment: AlignmentType.CENTER,
              spacing: { after: 200, before: 200 }
            })
          );
          break;

        case 'empty':
          docElements.push(
            new Paragraph({
              text: '',
              spacing: { after: 100 }
            })
          );
          break;

        case 'paragraph':
          const runs = createTextRuns(elem.text);
          docElements.push(
            new Paragraph({
              children: runs,
              spacing: { after: 120 }
            })
          );
          break;
      }
    }

    console.log('Generating Word document...');
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          children: docElements
        }
      ],
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
              size: 22, // 11pt
              color: '000000'
            },
            paragraph: {
              spacing: { line: 276, lineRule: 'auto' }
            }
          },
          heading1: {
            run: {
              font: 'Calibri',
              size: 32, // 16pt
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
              size: 28, // 14pt
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
              size: 24, // 12pt
              bold: true
            },
            paragraph: {
              spacing: { before: 180, after: 80 }
            }
          },
          code: {
            run: {
              font: 'Courier New',
              size: 20
            },
            paragraph: {
              shading: { fill: 'F5F5F5' },
              spacing: { before: 200, after: 200 }
            }
          }
        }
      },
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.LEFT
              }
            ]
          }
        ]
      }
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, 'PROPERTY_ARK_APP_HANDOVER_DOCUMENT.docx');
    
    console.log('Writing Word document to file...');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('\n✅ Word document created successfully!');
    console.log(`📄 File location: ${outputPath}`);
    console.log(`📊 Document contains ${docElements.length} elements`);
  } catch (error) {
    console.error('\n❌ Error converting to Word:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

convertMarkdownToWord();

