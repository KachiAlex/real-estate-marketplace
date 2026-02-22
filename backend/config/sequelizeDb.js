const { Sequelize } = require('sequelize');
const path = require('path');
// load env from workspace root (two levels up from config folder)
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

/**
 * PostgreSQL Database Connection Configuration using Sequelize
 * For the Firestore to PostgreSQL migration
 */

// Database connection URL - prefer explicit DATABASE_URL; otherwise construct
// from DB_* variables only when provided. If neither is present, throw an
// explicit error to avoid accidentally using local defaults (which can lead
// to confusing auth failures against 'postgres').
let DATABASE_URL;
if (process.env.DATABASE_URL) {
  DATABASE_URL = process.env.DATABASE_URL;
} else if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME) {
  DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
} else {
  // If running in development, fall back to a local Postgres instance on a
  // developer-friendly port to avoid accidental connection attempts to
  // production. This makes local dev smoother when no explicit DATABASE_URL
  // is provided. In non-development environments we still throw to avoid
  // silently using defaults.
  if (process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_DB === 'true') {
    const localPort = process.env.DB_PORT || 15432;
    const localUser = process.env.DB_USER || 'postgres';
    const localPass = process.env.DB_PASSWORD || 'password';
    const localDb = process.env.DB_NAME || 'real_estate_db';
    DATABASE_URL = `postgresql://${localUser}:${localPass}@localhost:${localPort}/${localDb}`;
    console.warn('No DATABASE_URL provided — falling back to local DB for development:', DATABASE_URL.replace(/:[^:]+@/, ':*****@'));
  } else {
    console.error('Missing DATABASE_URL and incomplete DB_* env vars. Set DATABASE_URL or DB_USER/DB_PASSWORD/DB_HOST/DB_NAME.');
    throw new Error('DATABASE configuration missing: set DATABASE_URL or DB_USER/DB_PASSWORD/DB_HOST/DB_NAME');
  }
}

console.log('Using DATABASE_URL for Sequelize:', DATABASE_URL && DATABASE_URL.replace(/:[^:]+@/, ':*****@'));

// Resolve SSL settings explicitly so startup logs are clear
// When the variable is undefined we treat it as "false" to avoid
// forcing SSL during local development when no .env is present.
const DB_REQUIRE_SSL = process.env.DB_REQUIRE_SSL || 'false';
// force SSL in production regardless of the variable
const resolvedRequireSSL = (DB_REQUIRE_SSL === 'true') || process.env.NODE_ENV === 'production';
const resolvedRejectUnauthorized = process.env.DB_REJECT_UNAUTHORIZED !== 'false';

console.log('Sequelize DB SSL config -> require:', resolvedRequireSSL, 'rejectUnauthorized:', resolvedRejectUnauthorized);

// Build Sequelize options and only include ssl dialectOptions when SSL is required
const sequelizeOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

if (resolvedRequireSSL) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: resolvedRejectUnauthorized
    }
  };
}

const sequelize = new Sequelize(DATABASE_URL, sequelizeOptions);

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
  InspectionRequest,
  AdminSettings
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
  InspectionRequest: InspectionRequest(sequelize),
  AdminSettings: AdminSettings(sequelize)
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

// --- Connection management: retry, backoff, periodic reconnect ---
const MAX_RETRIES = Number(process.env.DB_CONNECT_RETRIES || 5);
const RETRY_BASE_MS = Number(process.env.DB_RETRY_BASE_MS || 1000); // base for exponential backoff
const RECONNECT_INTERVAL_MS = Number(process.env.DB_RECONNECT_INTERVAL_MS || 30000);

db.isConnected = false;

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(maxRetries = MAX_RETRIES) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await sequelize.authenticate();
      db.isConnected = true;
      console.log('✅ PostgreSQL connected via Sequelize');
      return;
    } catch (err) {
      attempt += 1;
      db.isConnected = false;
      const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      console.error(`Postgres connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${wait}ms...`);
      await delay(wait);
    }
  }

  console.error('⚠️  Could not connect to Postgres after retries; will keep attempting every', RECONNECT_INTERVAL_MS, 'ms');
  // Keep periodically attempting to reconnect in background
  setInterval(async () => {
    try {
      await sequelize.authenticate();
      if (!db.isConnected) console.log('🔁 Reconnected to PostgreSQL');
      db.isConnected = true;
    } catch (e) {
      db.isConnected = false;
      console.log('Postgres reconnect attempt failed:', e.message);
    }
  }, RECONNECT_INTERVAL_MS);
}

// Start initial connection attempts without blocking module export
connectWithRetry().catch((e) => console.error('Unexpected error during Postgres connect attempts:', e));

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('Sequelize connection closed');
  } catch (e) {
    /* ignore */
  }
  process.exit(0);
});
