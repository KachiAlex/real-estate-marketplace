// AuditLog model is deprecated and removed. No-op for audit logging.
// const AuditLog = require('../models/AuditLog');

// Middleware to log admin actions
exports.logAdminAction = (action, entityType, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = async function(data) {
      // No-op: audit logging is disabled (model removed)
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Helper function to log specific actions
exports.logAction = async (req, action, entityType, entityId, details = {}) => {
  try {
    if (!req.user || req.user.role !== 'admin') return;
    
    await AuditLog.logAction({
      action,
      entityType,
      entityId,
      performedBy: req.user._id,
      description: details.description || `${action.replace(/_/g, ' ')} on ${entityType}`,
      oldValues: details.oldValues,
      newValues: details.newValues,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      additionalData: details.additionalData,
      severity: details.severity || 'low',
      status: details.status || 'success',
      errorMessage: details.errorMessage
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
