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
      type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    resolution: {
      type: DataTypes.TEXT
    },
    documents: {
      type: DataTypes.JSON
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
    timestamps: true
  });

  return DisputeResolution;
};
