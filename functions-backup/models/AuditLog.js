const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_created', 'user_updated', 'user_deleted', 'user_suspended', 'user_activated',
      'property_created', 'property_updated', 'property_deleted', 'property_verified',
      'escrow_created', 'escrow_updated', 'escrow_resolved', 'escrow_disputed',
      'settings_updated', 'payment_processed', 'dispute_resolved', 'admin_login'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['user', 'property', 'escrow', 'settings', 'payment', 'dispute', 'system']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  details: {
    description: {
      type: String,
      required: true
    },
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    maxlength: [500, 'Error message cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ action: 1, performedAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1, performedAt: -1 });
auditLogSchema.index({ severity: 1, performedAt: -1 });
auditLogSchema.index({ performedAt: -1 });

// Static method to log actions
auditLogSchema.statics.logAction = async function(data) {
  try {
    const log = new this({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      performedBy: data.performedBy,
      details: {
        description: data.description,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        additionalData: data.additionalData
      },
      severity: data.severity || 'low',
      status: data.status || 'success',
      errorMessage: data.errorMessage
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
