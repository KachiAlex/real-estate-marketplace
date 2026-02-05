const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SavedProperty = sequelize.define('SavedProperty', {
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
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'saved_properties',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'propertyId']
      }
    ]
  });

  return SavedProperty;
};
