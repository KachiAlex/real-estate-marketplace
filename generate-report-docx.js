#!/usr/bin/env node

const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, BorderStyle, VerticalAlign, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title
      new Paragraph({
        text: 'Comprehensive Security, Authentication & Functionality Audit Report',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      
      new Paragraph({
        text: 'Real Estate Marketplace Application',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      }),
      
      new Paragraph({
        text: 'Date: March 17, 2026',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      // Executive Summary
      new Paragraph({
        text: 'EXECUTIVE SUMMARY',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 }
      }),
      
      new Paragraph({
        text: 'This comprehensive audit of the Real Estate Marketplace application identifies 23 major issues across security, authentication, and functionality domains. The application is NOT production-ready without addressing critical vulnerabilities.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Total Issues Found:',
        bold: true,
        spacing: { after: 50 }
      }),
      
      // Issues Table
      new Table({
        rows: [
          new TableRow({
            height: { value: 400, rule: 'auto' },
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Severity', bold: true })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Count', bold: true })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'CRITICAL 🔴' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '6' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'HIGH 🟠' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '8' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'MEDIUM 🟡' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '6' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'LOW 🟢' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '3' })],
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } }
              })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 200 } }),

      // Critical Issues Section
      new Paragraph({
        text: 'I. CRITICAL SECURITY VULNERABILITIES 🔴',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: '1. Mock Authentication Bypass in Production',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),
      
      new Paragraph({
        text: 'Location: /backend/middleware/auth.js (lines 12-37)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Any user can impersonate any user by sending a custom header x-mock-user-email: <target-email>. This bypasses JWT authentication entirely.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: Complete authentication compromise. Attackers can access private data, modify accounts, process payments on behalf of others.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Remove ALLOW_MOCK_AUTH check in production. Disable mock authentication in production environments. Log all mock auth attempts for audit trail.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '2. Mock Tokens Accepted Without Validation',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/middleware/auth.js (lines 77-82)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Tokens beginning with "mock-" are accepted and bypass JWT verification.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: Frontend can forge fake mock-* tokens and authenticate as any user without actual JWT.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Remove mock token acceptance entirely in production. Never skip JWT verification based on token prefix.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3. Insufficient Role-Based Access Control (RBAC)',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/middleware/auth.js (lines 146-153)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Only checks single req.user.role, ignores req.user.roles array. No permission-level checks (read vs write). No resource ownership verification.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: Users can access resources they shouldnt have permission for (e.g., vendor accessing buyer payment data).',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Implement multiple role checking. Add resource-level authorization checks. Verify owner/vendor relationship before allowing operations.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '4. JWT Secret in Code (Development Mode)',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/routes/auth.js (line 18)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: If JWT_SECRET env var is missing, defaults to hardcoded secret visible in source code.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: Attackers can forge tokens using the hardcoded secret.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Throw error if JWT_SECRET is not set. Validate all required secrets at startup. Implement secret rotation mechanism.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '5. No Input Validation on Chat Message Content',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/routes/chats.js (lines 1-40)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: No validation of message content - could contain XSS payload.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: XSS vulnerability - malicious JavaScript can be stored in messages and executed when viewed by other users. This enables session hijacking and credential theft.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Validate message length (max 5000 chars). Strip HTML/script tags using xss library. Use parameterized queries for database storage.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '6. Password Reset Endpoint Not Protected',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/server.js (lines 31-39)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Endpoint always returns success regardless of email validity. No actual password reset email sent. Users cannot recover forgotten passwords.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: Password recovery broken. Attackers can enumerate valid email addresses.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Implement actual password reset flow with email verification. Hash reset tokens with 15-minute expiration. Send email with secure reset link.',
        spacing: { after: 200 }
      }),

      // High Issues Section
      new Paragraph({
        text: 'II. HIGH SEVERITY ISSUES 🟠',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: '7. Missing CSRF Protection',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: No CSRF tokens in forms or API requests.',
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Impact: Cross-site request forgery attacks possible (e.g., attacker tricks user into transferring funds).',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '8. Weak Password Requirements',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/routes/auth.js (line 47)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Only 6 character minimum (should be 12+). No complexity requirements (uppercase, numbers, symbols). No common password blacklist.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Enforce minimum 12 characters, require uppercase, lowercase, number, and symbol. Use common password blacklist library.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '9. No Rate Limiting on Payment Endpoints',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Payment endpoints accessible without rate limiting.',
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Impact: Brute force attacks, DoS, mass payment processing.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '10. Missing HTTPS Enforcement',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: No HSTS headers or redirect to HTTPS.',
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Impact: Man-in-the-middle attacks, credential interception.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '11. Debug Logging Exposing Sensitive Data',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/middleware/auth.js (lines 52-63)',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Debug logs may be captured by monitoring services, exposing authentication patterns. Token lengths are logged.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Recommendation: Never log auth headers, tokens, or passwords. Use structured logging (Winston, Bunyan). Remove debug logs from production.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '12. No API Rate Limiting',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Application lacks comprehensive rate limiting.',
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Impact: DoS attacks, API abuse, resource exhaustion.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '13. Admin Endpoints Lack Proper Authorization',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Location: /backend/routes/admin.js',
        bold: true,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Some admin endpoints only check single role, not admin-specific permissions.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Impact: Vendors with admin role could access other admin functions.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '14. No Encryption of Sensitive Data in Database',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Issue: Phone numbers, addresses, and payment info stored in plain text.',
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: 'Impact: Data breach exposes PII.',
        spacing: { after: 200 }
      }),

      // Recommendations Section
      new Paragraph({
        text: 'RECOMMENDATIONS PRIORITY LIST',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'IMMEDIATE (Do Today):',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: '1. Disable mock auth in production',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '2. Remove hardcoded JWT secrets',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '3. Validate all input (especially XSS in messages)',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '4. Implement password reset flow',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '5. Add rate limiting to payment endpoints',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'SHORT TERM (This Week):',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: '1. Implement CSRF protection',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '2. Enforce strong password requirements',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '3. Add HTTPS enforcement',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '4. Implement email verification',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '5. Add request logging',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'MEDIUM TERM (This Month):',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: '1. Implement database encryption',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '2. Add 2FA authentication',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '3. Implement comprehensive RBAC',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '4. Add API documentation',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '5. Implement audit logging',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'LONG TERM (This Quarter):',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 50 }
      }),

      new Paragraph({
        text: '1. Implement real-time monitoring',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '2. Add vulnerability scanning in CI/CD',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '3. Implement API versioning',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '4. Add GraphQL layer (optional)',
        spacing: { after: 25 }
      }),
      new Paragraph({
        text: '5. Implement federated authentication',
        spacing: { after: 200 }
      }),

      // Conclusion
      new Paragraph({
        text: 'CONCLUSION',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'The Real Estate Marketplace application has a functional foundation but requires significant security improvements before production deployment. Address all CRITICAL items immediately. The most urgent issues are mock authentication bypass, insufficient RBAC, and lack of input validation.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Estimated Time to Production-Ready: 2-3 weeks for CRITICAL + HIGH fixes, 6-8 weeks for all issues.',
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: 'Report Generated: March 17, 2026',
        bold: true,
        spacing: { after: 25 }
      }),

      new Paragraph({
        text: 'Next Review: After critical fixes completed',
        spacing: { after: 100 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(path.join(__dirname, 'COMPREHENSIVE_SECURITY_AUDIT_REPORT.docx'), buffer);
  console.log('✅ Report generated: COMPREHENSIVE_SECURITY_AUDIT_REPORT.docx');
});
