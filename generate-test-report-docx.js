const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, HeadingLevel, TextRun } = require('docx');

async function main() {
  const inputFile = path.join(__dirname, 'TEST_COMPREHENSIVE_REPORT.md');
  const outputFile = path.join(__dirname, 'TEST_COMPREHENSIVE_REPORT.docx');

  const markdown = fs.readFileSync(inputFile, 'utf8');
  const lines = markdown.split(/\r?\n/);

  const children = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(line.slice(2).trim())],
        })
      );
      continue;
    }

    if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(line.slice(3).trim())],
        })
      );
      continue;
    }

    if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun(line.slice(4).trim())],
        })
      );
      continue;
    }

    if (line.startsWith('- ')) {
      children.push(
        new Paragraph({
          text: line.slice(2),
          bullet: { level: 0 },
        })
      );
      continue;
    }

    if (line.trim() === '') {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    children.push(new Paragraph({ text: line }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputFile, buffer);

  console.log(`Created ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});