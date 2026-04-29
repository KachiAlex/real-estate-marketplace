const { DataTypes } = require('sequelize');

/**
 * Sequelize User model aligned with Neon users table (see neon-migration.sql).
 * Postgres lowercases unquoted identifiers, so camelCase columns like
 * `firstName` become `firstname`. We map those via the `field` option.
 */
module.exports = (sequelize) =>
  sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      lowercase: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'firstname'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'lastname'
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'isactive'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'isverified'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
  });
