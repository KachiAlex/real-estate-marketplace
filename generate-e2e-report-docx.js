const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, BorderStyle, WidthType, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        text: 'E2E CYPRESS VALIDATION REPORT',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Date: ${new Date().toISOString().split('T')[0]}`,
        spacing: { after: 400 }
      }),
      
      // Executive Summary
      new Paragraph({
        text: 'Executive Summary',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: 'Full 16-spec Cypress E2E suite was executed against the frontend dev server (localhost:3000). Results show partial test failures across multiple spec files, primarily due to missing page elements and form fields.',
        spacing: { after: 400 }
      }),

      // Overall Status
      new Paragraph({
        text: 'Overall Status',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: [
          new TextRun({ text: 'Suites Passed: ', bold: true }),
          new TextRun('1 of ~16+ (partial output captured)')
        ],
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: [
          new TextRun({ text: 'Tests Passing: ', bold: true }),
          new TextRun('2+ (authentication.cy.js)')
        ],
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: [
          new TextRun({ text: 'Tests Failing: ', bold: true }),
          new TextRun('6+ (buyer-journey.cy.js: 5, debug-overlay.cy.js: 1)')
        ],
        spacing: { after: 400 }
      }),

      // Spec Results (Captured)
      new Paragraph({
        text: 'Spec-Level Results (Captured)',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Spec File')], shading: { fill: 'CCCCCC' } }),
              new TableCell({ children: [new Paragraph('Tests')], shading: { fill: 'CCCCCC' } }),
              new TableCell({ children: [new Paragraph('Passing')], shading: { fill: 'CCCCCC' } }),
              new TableCell({ children: [new Paragraph('Failing')], shading: { fill: 'CCCCCC' } }),
              new TableCell({ children: [new Paragraph('Status')], shading: { fill: 'CCCCCC' } })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('authentication.cy.js')] }),
              new TableCell({ children: [new Paragraph('2')] }),
              new TableCell({ children: [new Paragraph('2')] }),
              new TableCell({ children: [new Paragraph('0')] }),
              new TableCell({ children: [new Paragraph('✅ PASS')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('buyer-journey.cy.js')] }),
              new TableCell({ children: [new Paragraph('5')] }),
              new TableCell({ children: [new Paragraph('0')] }),
              new TableCell({ children: [new Paragraph('5')] }),
              new TableCell({ children: [new Paragraph('❌ FAIL')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('debug-overlay.cy.js')] }),
              new TableCell({ children: [new Paragraph('1')] }),
              new TableCell({ children: [new Paragraph('0')] }),
              new TableCell({ children: [new Paragraph('1')] }),
              new TableCell({ children: [new Paragraph('❌ FAIL')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('escrow-payments.cy.js through vendor-registration.cy.js (13 remaining)'), new Paragraph('(output truncated)')] }),
              new TableCell({ children: [new Paragraph('-')] }),
              new TableCell({ children: [new Paragraph('-')] }),
              new TableCell({ children: [new Paragraph('-')] }),
              new TableCell({ children: [new Paragraph('?')] })
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 400 } }),

      // Failure Summary
      new Paragraph({
        text: 'Failure Analysis',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: 'buyer-journey.cy.js (5 tests failing)',
        heading: 'Heading3',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Error: "Expected to find element: input[name="email"], but never found it."',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Root Cause: Test is looking for form inputs that do not exist in the current page structure. Possible causes: (1) Page navigation not completing before assertions, (2) Registration/login modal not rendering, (3) Page restructuring.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'debug-overlay.cy.js (1 test failing)',
        heading: 'Heading3',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Error: "Expected to find element: iframe#webpack-dev-server-client-overlay, but never found it."',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Root Cause: Test expects Webpack dev server overlay iframe which may not be present in headless Electron browser or production build mode.',
        spacing: { after: 400 }
      }),

      // Frontend/Backend Unit Tests Summary
      new Paragraph({
        text: 'Frontend & Backend Unit Tests (Grouped Rerun)',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: 'Frontend Tests: 7 suites, 32 tests ✅ PASS',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Backend Tests: 3 suites, 32 tests ✅ PASS',
        spacing: { after: 400 }
      }),

      // Recommendations
      new Paragraph({
        text: 'Recommendations',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '1. Investigate page navigation timing in buyer-journey.cy.js - add explicit waits for elements before assertions',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '2. Refactor debug-overlay.cy.js test or mark as skipped in headless/production mode',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '3. Complete E2E suite execution with full output capture for remaining 13 specs',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '4. Consider separating E2E tests by user journey type (buyer, seller, admin) for better parallel execution and failure isolation',
        spacing: { after: 400 }
      }),

      // Environment Info
      new Paragraph({
        text: 'Test Environment',
        heading: 'Heading2',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Frontend Base URL: http://localhost:3000`,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: `Backend Base URL: http://localhost:3001`,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: `Cypress Version: 13.17.0`,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: `Browser: Electron 118 (headless)`,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: `Command: CYPRESS_BASE_URL='http://localhost:3000' npx cypress run --headless`,
        spacing: { after: 300 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  require('fs').writeFileSync('E2E_VALIDATION_REPORT.docx', buffer);
  console.log('Created E2E_VALIDATION_REPORT.docx');
});
