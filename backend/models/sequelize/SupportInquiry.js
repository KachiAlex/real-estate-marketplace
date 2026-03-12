const { DataTypes } = require('sequelize');

const generateReferenceCode = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SUP-${datePart}-${randomPart}`;
};

module.exports = (sequelize) => {
  const SupportInquiry = sequelize.define('SupportInquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    referenceCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: generateReferenceCode
    },
    userName: {
      type: DataTypes.STRING
    },
    userEmailSnapshot: {
      type: DataTypes.STRING
    },
    contactEmail: {
      type: DataTypes.STRING
    },
    contactPhone: {
      type: DataTypes.STRING
    },
    sourceRole: {
      type: DataTypes.STRING
    },
    category: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resolutionNotes: {
      type: DataTypes.TEXT
    },
    resolvedAt: {
      type: DataTypes.DATE
    },
    resolvedByAdminId: {
      type: DataTypes.UUID
    },
    attachments: {
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
    tableName: 'support_inquiries',
    timestamps: true,
    underscored: true
  });

  return SupportInquiry;
};
