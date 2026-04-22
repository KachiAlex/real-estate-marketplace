const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MortgageApplication = sequelize.define('MortgageApplication', {
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
    mortgageBankId: {
      type: DataTypes.UUID
    },
    loanAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    loanTerm: {
      type: DataTypes.INTEGER
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2)
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'completed'),
      defaultValue: 'pending'
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
    tableName: 'mortgage_applications',
    timestamps: true
  });

  return MortgageApplication;
};
