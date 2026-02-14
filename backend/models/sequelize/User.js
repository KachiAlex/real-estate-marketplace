const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
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
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    avatar: {
      type: DataTypes.STRING
    },
    role: {
      type: DataTypes.ENUM('user', 'agent', 'admin', 'mortgage_bank', 'vendor'),
      defaultValue: 'user'
    },
    roles: {
      type: DataTypes.JSON,
      defaultValue: ['user']
    },

    provider: {
      type: DataTypes.STRING,
      defaultValue: 'email'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    kycStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    userCode: {
      type: DataTypes.STRING
    },
    vendorCode: {
      type: DataTypes.STRING
    },
    gender: {
      type: DataTypes.STRING
    },
    occupation: {
      type: DataTypes.STRING
    },
    company: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    bankDetails: {
      type: DataTypes.JSON
    },
    vendorCategory: {
      type: DataTypes.STRING
    },
    vendorData: {
      type: DataTypes.JSON
    },
    lastLogin: {
      type: DataTypes.DATE
    },
    lastSeen: {
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
    tableName: 'users',
    timestamps: true
  });

  return User;
};
