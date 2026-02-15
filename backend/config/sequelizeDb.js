const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * PostgreSQL Database Connection Configuration using Sequelize
 * For the Firestore to PostgreSQL migration
 */

// Database connection URL - from environment or fallback
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'real_estate_db'}`;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' || DATABASE_URL.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Import all model factory functions from sequelize models
const {
  User,
  Property,
  EscrowTransaction,
  Investment,
  UserInvestment,
  MortgageApplication,
  Mortgage,
  MortgageBank,
  Blog,
  SupportInquiry,
  VerificationApplication,
  Message,
  Notification,
  SavedProperty,
  PropertyInquiry,
  PropertyAlert,
  DisputeResolution,
  InspectionRequest
} = require('../models/sequelize');

// Initialize all models
const db = {
  sequelize,
  Sequelize,
  User: User(sequelize),
  Property: Property(sequelize),
  EscrowTransaction: EscrowTransaction(sequelize),
  Investment: Investment(sequelize),
  UserInvestment: UserInvestment(sequelize),
  MortgageApplication: MortgageApplication(sequelize),
  Mortgage: Mortgage(sequelize),
  MortgageBank: MortgageBank(sequelize),
  Blog: Blog(sequelize),
  SupportInquiry: SupportInquiry(sequelize),
  VerificationApplication: VerificationApplication(sequelize),
  Message: Message(sequelize),
  Notification: Notification(sequelize),
  SavedProperty: SavedProperty(sequelize),
  PropertyInquiry: PropertyInquiry(sequelize),
  PropertyAlert: PropertyAlert(sequelize),
  DisputeResolution: DisputeResolution(sequelize),
  InspectionRequest: InspectionRequest(sequelize)
};

// Define relationships

// User relationships
db.User.hasMany(db.Property, { foreignKey: 'ownerId', as: 'properties' });
db.Property.belongsTo(db.User, { foreignKey: 'ownerId', as: 'owner' });

db.User.hasMany(db.EscrowTransaction, { foreignKey: 'buyerId', as: 'buyerEscrows' });
db.User.hasMany(db.EscrowTransaction, { foreignKey: 'sellerId', as: 'sellerEscrows' });
db.EscrowTransaction.belongsTo(db.User, { foreignKey: 'buyerId', as: 'buyer' });
db.EscrowTransaction.belongsTo(db.User, { foreignKey: 'sellerId', as: 'seller' });

db.User.hasMany(db.UserInvestment, { foreignKey: 'userId', as: 'investments' });
db.UserInvestment.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.MortgageApplication, { foreignKey: 'userId', as: 'mortgageApplications' });
db.MortgageApplication.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Mortgage, { foreignKey: 'userId', as: 'mortgages' });
db.Mortgage.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Blog, { foreignKey: 'authorId', as: 'blogPosts' });
db.Blog.belongsTo(db.User, { foreignKey: 'authorId', as: 'author' });

db.User.hasMany(db.SupportInquiry, { foreignKey: 'userId', as: 'supportInquiries' });
db.SupportInquiry.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Message, { foreignKey: 'senderId', as: 'sentMessages' });
db.User.hasMany(db.Message, { foreignKey: 'recipientId', as: 'receivedMessages' });
db.Message.belongsTo(db.User, { foreignKey: 'senderId', as: 'sender' });
db.Message.belongsTo(db.User, { foreignKey: 'recipientId', as: 'recipient' });

db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.SavedProperty, { foreignKey: 'userId', as: 'savedProperties' });
db.SavedProperty.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.PropertyInquiry, { foreignKey: 'buyerId', as: 'propertyInquiries' });
db.PropertyInquiry.belongsTo(db.User, { foreignKey: 'buyerId', as: 'buyer' });

db.User.hasMany(db.PropertyAlert, { foreignKey: 'userId', as: 'propertyAlerts' });
db.PropertyAlert.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.DisputeResolution, { foreignKey: 'initiatedBy', as: 'initiatedDisputes' });
db.DisputeResolution.belongsTo(db.User, { foreignKey: 'initiatedBy', as: 'initiator' });

db.User.hasMany(db.InspectionRequest, { foreignKey: 'requesterId', as: 'inspectionRequests' });
db.User.hasMany(db.InspectionRequest, { foreignKey: 'inspectorId', as: 'inspections' });
db.InspectionRequest.belongsTo(db.User, { foreignKey: 'requesterId', as: 'requester' });
db.InspectionRequest.belongsTo(db.User, { foreignKey: 'inspectorId', as: 'inspector' });

db.User.hasMany(db.VerificationApplication, { foreignKey: 'vendorId', as: 'verificationApplications' });
db.VerificationApplication.belongsTo(db.User, { foreignKey: 'vendorId', as: 'vendor' });

// Property relationships
db.Property.hasMany(db.EscrowTransaction, { foreignKey: 'propertyId', as: 'escrows' });
db.EscrowTransaction.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.Investment, { foreignKey: 'propertyId', as: 'investments' });
db.Investment.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.MortgageApplication, { foreignKey: 'propertyId', as: 'mortgageApplications' });
db.MortgageApplication.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.Mortgage, { foreignKey: 'propertyId', as: 'mortgages' });
db.Mortgage.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.SavedProperty, { foreignKey: 'propertyId', as: 'savedBy' });
db.SavedProperty.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.PropertyInquiry, { foreignKey: 'propertyId', as: 'inquiries' });
db.PropertyInquiry.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.Message, { foreignKey: 'propertyId', as: 'messages' });
db.Message.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.VerificationApplication, { foreignKey: 'propertyId', as: 'verifications' });
db.VerificationApplication.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

db.Property.hasMany(db.InspectionRequest, { foreignKey: 'propertyId', as: 'inspectionRequests' });
db.InspectionRequest.belongsTo(db.Property, { foreignKey: 'propertyId', as: 'property' });

// Investment relationships
db.Investment.hasMany(db.UserInvestment, { foreignKey: 'investmentId', as: 'userInvestments' });
db.UserInvestment.belongsTo(db.Investment, { foreignKey: 'investmentId', as: 'investment' });

// MortgageBank relationships
db.MortgageBank.hasMany(db.MortgageApplication, { foreignKey: 'mortgageBankId', as: 'applications' });
db.MortgageApplication.belongsTo(db.MortgageBank, { foreignKey: 'mortgageBankId', as: 'bank' });

db.User.hasMany(db.MortgageBank, { foreignKey: 'userId', as: 'mortgageBanks' });
db.MortgageBank.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// MortgageApplication relationships
db.MortgageApplication.hasOne(db.Mortgage, { foreignKey: 'applicationId', as: 'mortgage' });
db.Mortgage.belongsTo(db.MortgageApplication, { foreignKey: 'applicationId', as: 'application' });

// EscrowTransaction relationships
db.EscrowTransaction.hasOne(db.DisputeResolution, { foreignKey: 'escrowId', as: 'dispute' });
db.DisputeResolution.belongsTo(db.EscrowTransaction, { foreignKey: 'escrowId', as: 'escrow' });

module.exports = db;
