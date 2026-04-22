const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Mortgage = sequelize.define('Mortgage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    applicationId: {
      type: DataTypes.UUID
    },
    loanAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    monthlyPayment: {
      type: DataTypes.DECIMAL(15, 2)
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2)
    },
    loanTerm: {
      type: DataTypes.INTEGER
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2)
    },
    startDate: {
      type: DataTypes.DATE
    },
    endDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'defaulted'),
      defaultValue: 'active'
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
    tableName: 'mortgages',
    timestamps: true
  });

  return Mortgage;
};
