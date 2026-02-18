const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    investmentId: {
      type: DataTypes.UUID,
      allowNull: true // nullable for non-investment payments
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true // nullable for non-property payments
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    paymentType: {
      type: DataTypes.ENUM('property_purchase', 'investment', 'escrow', 'subscription', 'commission', 'refund'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
      defaultValue: 'pending'
    },
    provider: {
      type: DataTypes.STRING // e.g., 'flutterwave', 'paystack', 'stripe', 'bank_transfer'
    },
    reference: {
      type: DataTypes.STRING,
      unique: true
    },
    metadata: {
      type: DataTypes.JSON
    },
    timeline: {
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
    tableName: 'payments',
    timestamps: true
  });

  return Payment;
};
