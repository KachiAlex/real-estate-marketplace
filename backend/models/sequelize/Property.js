const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Property = sequelize.define('Property', {
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
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    ownerEmail: {
      type: DataTypes.STRING
    },
    location: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM('residential', 'commercial', 'agricultural', 'mixed-use'),
      defaultValue: 'residential'
    },
    bedrooms: {
      type: DataTypes.INTEGER
    },
    bathrooms: {
      type: DataTypes.INTEGER
    },
    area: {
      type: DataTypes.DECIMAL(10, 2)
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN'
    },
    monthly_rent: {
      type: DataTypes.DECIMAL(15, 2)
    },
    annual_taxes: {
      type: DataTypes.DECIMAL(15, 2)
    },
    hoa_fees: {
      type: DataTypes.DECIMAL(15, 2)
    },
    images: {
      type: DataTypes.JSON
    },
    featuredImage: {
      type: DataTypes.STRING
    },
    coverImage: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'sold', 'pending'),
      defaultValue: 'active'
    },
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    inquiries_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    favorites_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_investment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    investment_data: {
      type: DataTypes.JSON
    },
    documents: {
      type: DataTypes.JSON
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
    tableName: 'properties',
    timestamps: true
  });

  return Property;
};
