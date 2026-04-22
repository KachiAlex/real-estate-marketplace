const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DisputeResolution = sequelize.define('DisputeResolution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    escrowId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    initiatedBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('open', 'in_review', 'resolved', 'escalated', 'closed'),
      defaultValue: 'open'
    },
    documents: {
      type: DataTypes.JSON,
      comment: 'Array of buyer evidence files with URLs and metadata'
    },
    sellerResponse: {
      type: DataTypes.TEXT,
      comment: 'Seller written response to dispute'
    },
    sellerEvidence: {
      type: DataTypes.JSON,
      comment: 'Array of seller counter-evidence files'
    },
    firstResponseDeadline: {
      type: DataTypes.DATE,
      comment: 'SLA deadline for first admin response (24 hours from filing)'
    },
    resolutionDeadline: {
      type: DataTypes.DATE,
      comment: 'SLA deadline for full resolution (72 hours from filing)'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      comment: 'When dispute was resolved'
    },
    resolvedBy: {
      type: DataTypes.UUID,
      comment: 'Admin user who resolved the dispute'
    },
    escalatedAt: {
      type: DataTypes.DATE,
      comment: 'When dispute was escalated (SLA breach or manual)'
    },
    escalatedBy: {
      type: DataTypes.UUID,
      comment: 'Admin who escalated or triggered escalation'
    },
    timeline: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of dispute events for audit trail'
    },
    adminNotes: {
      type: DataTypes.TEXT,
      comment: 'Admin notes for resolution reasoning'
    },
    resolution: {
      type: DataTypes.ENUM('buyer_favor', 'seller_favor', 'partial_refund', 'full_refund'),
      comment: 'Type of resolution applied'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'dispute_resolutions',
    timestamps: true,
    indexes: [
      { fields: ['escrowId'] },
      { fields: ['status'] },
      { fields: ['initiatedBy'] },
      { fields: ['resolvedBy'] }
    ]
  });

  return DisputeResolution;
};
