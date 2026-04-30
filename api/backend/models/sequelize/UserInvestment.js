const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserInvestment = sequelize.define('UserInvestment', {
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
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    documents: {
      type: DataTypes.JSON
    },
    returnAmount: {
      type: DataTypes.DECIMAL(15, 2)
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
    tableName: 'user_investments',
    timestamps: true
  });

  return UserInvestment;
};
