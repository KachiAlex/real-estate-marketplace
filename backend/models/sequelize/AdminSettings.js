const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminSettings = sequelize.define('AdminSettings', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: 'global'
    },
    verificationFee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50000 },
    verificationBadgeColor: { type: DataTypes.STRING, allowNull: false, defaultValue: '#10B981' },
    vendorListingFee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100000 },
    escrowTimeoutDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 7 },
    platformFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.025 },
    maxFileSize: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10485760 },
    allowedFileTypes: { type: DataTypes.JSON, allowNull: false, defaultValue: [
      'image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ] },
    maintenanceMode: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    maintenanceMessage: { type: DataTypes.STRING },
    emailNotifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    smsNotifications: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoApproveProperties: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoApproveUsers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'admin_settings',
    timestamps: true
  });

  return AdminSettings;
};