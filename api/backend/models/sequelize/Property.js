const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Property', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'residential'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    location: {
      type: DataTypes.TEXT
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'ownerid'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdat'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedat'
    }
  }, {
    tableName: 'properties',
    timestamps: true
  });
