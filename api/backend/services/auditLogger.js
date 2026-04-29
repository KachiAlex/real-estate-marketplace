/**
 * Phase 3.3: Audit Logging Service
 * Tracks all financial operations (payments, escrow, transactions) with immutable audit logs
 * Records: timestamp, user, operation type, amount, status, IP address, user agent
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuditLogger {
  constructor() {
    this.auditDir = path.resolve(__dirname, '..', 'audit_logs');
    this.ensureAuditDirectory();
  }

  ensureAuditDirectory() {
    try {
      if (!fs.existsSync(this.auditDir)) {
        fs.mkdirSync(this.auditDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create audit logs directory:', error.message);
    }
  }

  /**
   * Log a financial operation (payment, escrow, transaction)
   * @param {Object} operation - Operation details
   * @param {string} operation.type - Operation type (payment_initialized, payment_verified, escrow_created, etc.)
   * @param {string} operation.userID - User who initiated the operation
   * @param {string} operation.userEmail - User email
   * @param {number} operation.amount - Transaction amount
   * @param {string} operation.currency - Currency (NGN, USD, etc.)
   * @param {string} operation.status - Operation status (success, failed, pending)
   * @param {string} operation.reference - Transaction reference/ID
   * @param {Object} operation.metadata - Additional metadata
   * @param {string} operation.ipAddress - User's IP address
   * @param {string} operation.userAgent - User's browser/client agent
   * @param {string} operation.relatedEntity - Related entity ID (propertyId, escrowId, etc.)
   * @returns {Object} Audit log entry created
   */
  logFinancialOperation(operation) {
    try {
      const timestamp = new Date().toISOString();
      
      // Create audit entry with hash for integrity verification
      const auditEntry = {
        timestamp,
        id: crypto.randomUUID(),
        type: operation.type,
        userId: operation.userID,
        userEmail: operation.userEmail,
        amount: operation.amount,
        currency: operation.currency || 'NGN',
        status: operation.status,
        reference: operation.reference,
        relatedEntity: operation.relatedEntity,
        metadata: operation.metadata || {},
        ipAddress: operation.ipAddress,
        userAgent: operation.userAgent,
        environment: process.env.NODE_ENV || 'development'
      };

      // Calculate hash for immutability verification
      auditEntry.hash = this.calculateHash(auditEntry);

      // Write to audit log in JSON format
      this.writeAuditLog(auditEntry);

      // Also log to console in production for log aggregation
      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
          level: 'AUDIT',
          ...auditEntry
        }));
      }

      return auditEntry;
    } catch (error) {
      console.error('Failed to log financial operation:', error.message);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  }

  /**
   * Log a payment operation
   */
  logPaymentOperation(operation, req) {
    return this.logFinancialOperation({
      ...operation,
      userID: req.user?.id,
      userEmail: req.user?.email,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    });
  }

  /**
   * Log an escrow operation
   */
  logEscrowOperation(operation, req) {
    return this.logFinancialOperation({
      ...operation,
      userID: req.user?.id,
      userEmail: req.user?.email,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    });
  }

  /**
   * Calculate SHA-256 hash for audit entry integrity
   */
  calculateHash(entry) {
    // Create a stable string representation for hashing
    const hashInput = [
      entry.timestamp,
      entry.id,
      entry.type,
      entry.userId,
      entry.amount,
      entry.reference,
      entry.status
    ].join('|');

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Write audit log entry to file
   */
  writeAuditLog(entry) {
    try {
      // Create daily log file for easy rotation and analysis
      const date = new Date(entry.timestamp);
      const dateString = date.toISOString().split('T')[0];
      const logFile = path.join(this.auditDir, `audit_${dateString}.jsonl`);

      // Write in JSONL format (one JSON object per line) for easy parsing
      fs.appendFileSync(
        logFile,
        JSON.stringify(entry) + '\n',
        { encoding: 'utf8' }
      );

      // Also maintain a summary log for quick reference
      this.writeSummaryLog(entry);
    } catch (error) {
      console.error('Failed to write audit log:', error.message);
    }
  }

  /**
   * Write summary of critical financial operations
   */
  writeSummaryLog(entry) {
    try {
      // Only log major transactions
      if ((entry.amount || 0) >= 50000 || entry.status === 'failed') {
        const summaryFile = path.join(this.auditDir, 'financial_summary.csv');
        
        const csvLine = [
          entry.timestamp,
          entry.type,
          entry.userId || 'unknown',
          entry.userEmail || 'unknown',
          entry.amount || 0,
          entry.currency,
          entry.status,
          entry.reference || 'N/A',
          entry.ipAddress || 'unknown'
        ].join(',') + '\n';

        fs.appendFileSync(summaryFile, csvLine, { encoding: 'utf8' });
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Verify audit log integrity
   */
  verifyAuditEntry(entry) {
    const calculatedHash = this.calculateHash(entry);
    return calculatedHash === entry.hash;
  }

  /**
   * Read audit logs for a date range
   */
  readAuditLogs(startDate, endDate) {
    const logs = [];
    try {
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        const logFile = path.join(this.auditDir, `audit_${dateString}.jsonl`);

        if (fs.existsSync(logFile)) {
          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.trim().split('\n').filter(l => l);
          
          lines.forEach(line => {
            try {
              logs.push(JSON.parse(line));
            } catch (e) {
              // Skip malformed lines
            }
          });
        }

        current.setDate(current.getDate() + 1);
      }
    } catch (error) {
      console.error('Failed to read audit logs:', error.message);
    }

    return logs;
  }

  /**
   * Generate audit report for analysis
   */
  generateAuditReport(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date(),
      userId = null,
      operationType = null
    } = options;

    const logs = this.readAuditLogs(startDate, endDate);
    let filtered = logs;

    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }

    if (operationType) {
      filtered = filtered.filter(log => log.type === operationType);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      filters: { userId, operationType },
      summary: {
        totalOperations: filtered.length,
        successfulOperations: filtered.filter(l => l.status === 'success').length,
        failedOperations: filtered.filter(l => l.status === 'failed').length,
        pendingOperations: filtered.filter(l => l.status === 'pending').length,
        totalAmount: filtered.reduce((sum, l) => sum + (l.amount || 0), 0)
      },
      operations: filtered.slice(0, 1000) // Limit to last 1000 for report size
    };

    return report;
  }
}

// Export singleton instance
module.exports = new AuditLogger();
