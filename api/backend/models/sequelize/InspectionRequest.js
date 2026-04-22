const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InspectionRequest = sequelize.define('InspectionRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    requesterId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    inspectorId: {
      type: DataTypes.UUID
    },
    scheduledDate: {
      type: DataTypes.DATE
    },
    completedDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('pending', 'scheduled', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    report: {
      type: DataTypes.JSON
    },
    notes: {
      type: DataTypes.TEXT
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
    tableName: 'inspection_requests',
    timestamps: true
  });

  return InspectionRequest;
};
