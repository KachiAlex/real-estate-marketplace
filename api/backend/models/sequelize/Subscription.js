const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscription_plans',
        key: 'id',
      },
      validate: {
        isValidUUIDOrNull(value) {
          // Allow null values
          if (value === null || value === undefined) {
            return;
          }
          // Only allow valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(value)) {
            throw new Error(`planId must be a valid UUID or null, received: ${value}`);
          }
        }
      }
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'NGN',
    },
    status: {
      type: DataTypes.ENUM(
        'trial',
        'pending',
        'active',
        'pending_payment',
        'payment_failed',
        'expired',
        'cancelled',
        'suspended',
        'inactive'
      ),
      defaultValue: 'trial',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    trialEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'paystack',
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
    },
    nextPaymentDate: {
      type: DataTypes.DATE,
    },
    lastPaymentAttempt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    suspensionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'subscriptions',
    timestamps: true,
  });

  return Subscription;
};
