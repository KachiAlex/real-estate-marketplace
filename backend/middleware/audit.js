const AuditLog = require('../models/AuditLog');

// Middleware to log admin actions
exports.logAdminAction = (action, entityType, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function(data) {
      try {
        // Only log successful admin actions
        if (req.user && req.user.role === 'admin' && res.statusCode < 400) {
          const entityId = req.params.id || req.body.id || req.body.propertyId || req.body.userId;
          
          let description = options.description;
          if (!description) {
            description = `${action.replace(/_/g, ' ')} on ${entityType}`;
          }
          
          await AuditLog.logAction({
            action,
            entityType,
            entityId,
            performedBy: req.user._id,
            description,
            oldValues: options.oldValues || null,
            newValues: options.newValues || req.body,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            additionalData: options.additionalData || null,
            severity: options.severity || 'low',
            status: res.statusCode < 400 ? 'success' : 'failed'
          });
        }
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't fail the request if audit logging fails
      }
      
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
