const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PropertyInquiry = sequelize.define('PropertyInquiry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    propertyTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    propertyPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    propertyImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    inquiryType: {
      type: DataTypes.ENUM('message', 'call', 'viewing'),
      defaultValue: 'message'
    },
    message: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'responded', 'closed'),
      defaultValue: 'pending'
    },
    respondedAt: {
      type: DataTypes.DATE
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
    tableName: 'property_inquiries',
    timestamps: true
  });

  return PropertyInquiry;
};
