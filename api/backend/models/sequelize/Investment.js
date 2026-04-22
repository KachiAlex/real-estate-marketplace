const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Investment = sequelize.define('Investment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    minInvestment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    targetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    raisedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    expectedReturn: {
      type: DataTypes.DECIMAL(5, 2)
    },
    investmentTerm: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'completed', 'cancelled'),
      defaultValue: 'active'
    },
    documents: {
      type: DataTypes.JSON
    },
    startDate: {
      type: DataTypes.DATE
    },
    endDate: {
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
    tableName: 'investments',
    timestamps: true
  });

  return Investment;
};
