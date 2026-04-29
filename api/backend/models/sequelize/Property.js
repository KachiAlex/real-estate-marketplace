const { DataTypes } = require('sequelize');

/**
 * Properties table in Neon only contains the core listing columns defined in
 * neon-migration.sql. Keep this model lean and map camelCase attributes to the
 * lowercase column names Postgres stores internally.
 */
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
    ownerEmail: {
      type: DataTypes.STRING,
      field: 'owneremail'
    },
    address: {
      type: DataTypes.STRING,
      field: 'address'
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      field: 'bedrooms'
    },
    bathrooms: {
      type: DataTypes.FLOAT,
      field: 'bathrooms'
    },
    area: {
      type: DataTypes.FLOAT,
      field: 'area'
    },
    images: {
      type: DataTypes.JSON,
      field: 'images'
    },
    videos: {
      type: DataTypes.JSON,
      field: 'videos'
    },
    documents: {
      type: DataTypes.JSON,
      field: 'documents'
    },
    coverImage: {
      type: DataTypes.STRING,
      field: 'coverimage'
    },
    featuredImage: {
      type: DataTypes.STRING,
      field: 'featuredimage'
    },
    category: {
      type: DataTypes.STRING,
      field: 'category'
    },
    verificationStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      field: 'verificationstatus'
    },
    approvalStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      field: 'approvalstatus'
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
    timestamps: true,
    underscored: true
  });
