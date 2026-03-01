const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'NGN',
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly'),
      allowNull: false,
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    maxProperties: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    maxImages: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: 'subscription_plans',
    timestamps: true,
  });

  return SubscriptionPlan;
};
