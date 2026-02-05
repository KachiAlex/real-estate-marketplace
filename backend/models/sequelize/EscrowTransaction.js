const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EscrowTransaction = sequelize.define('EscrowTransaction', {
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
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    status: {
      type: DataTypes.ENUM('pending', 'funded', 'completed', 'disputed', 'cancelled'),
      defaultValue: 'pending'
    },
    escrowAgent: {
      type: DataTypes.STRING
    },
    fundedAt: {
      type: DataTypes.DATE
    },
    completedAt: {
      type: DataTypes.DATE
    },
    documents: {
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
    tableName: 'escrow_transactions',
    timestamps: true
  });

  return EscrowTransaction;
};
