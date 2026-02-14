const admin = require('firebase-admin');
const db = require('../config/sequelizeDb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Migration Script: Firestore → PostgreSQL
 * Exports all Firestore collections to PostgreSQL tables
 * 
 * Usage: node migration/migrate.js
 */

let migratedCount = {
  users: 0,
  properties: 0,
  investments: 0,
  mortgages: 0,
  other: 0
};

const migrationErrors = [];

/**
 * Migrate Users Collection
 */
async function migrateUsers() {
  console.log('\n📦 Migrating Users...');
  try {
    const snapshot = await admin.firestore().collection('users').get();
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        // Skip if user already exists
        const existingUser = await db.User.findOne({
          where: { email: data.email?.toLowerCase() }
        });
        
        if (existingUser) {
          console.log(`⏭️  User ${data.email} already exists, skipping`);
          continue;
        }

        // Hash password if it exists (should be done during password reset)
        let password = data.password;
        if (password && !password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          password = await bcrypt.hash(password, salt);
        }

        await db.User.create({
          id: data.id || doc.id,
          email: data.email?.toLowerCase(),
          password: password || null,
          firstName: data.firstName || data.first_name || 'Unknown',
          lastName: data.lastName || data.last_name || 'Unknown',
          phone: data.phone,
          avatar: data.avatar,
          role: data.role || 'user',
          roles: data.roles || [data.role || 'user'],

          provider: data.provider || 'email',
          isVerified: data.isVerified || data.is_verified || false,
          isActive: data.isActive !== false,
          kycStatus: data.kycStatus || data.kyc_status || 'pending',
          userCode: data.userCode || data.user_code,
          vendorCode: data.vendorCode || data.vendor_code,
          gender: data.gender,
          occupation: data.occupation,
          company: data.company,
          address: data.address,
          bankDetails: data.bankDetails || data.bank_details,
          vendorCategory: data.vendorCategory || data.vendor_category,
          vendorData: data.vendorData || data.vendor_data,
          lastLogin: data.lastLogin ? new Date(data.lastLogin) : null,
          lastSeen: data.lastSeen ? new Date(data.lastSeen) : null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });

        migratedCount.users++;
        console.log(`✅ Migrated user: ${data.email}`);
      } catch (error) {
        migrationErrors.push(`User migration error: ${error.message}`);
        console.error(`❌ Error migrating user ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Users migration completed: ${migratedCount.users} users migrated`);
  } catch (error) {
    console.error('❌ Users collection migration failed:', error);
    migrationErrors.push(`Users migration failed: ${error.message}`);
  }
}

/**
 * Migrate Properties Collection
 */
async function migrateProperties() {
  console.log('\n📦 Migrating Properties...');
  try {
    const snapshot = await admin.firestore().collection('properties').get();
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        // Skip if property already exists
        const existingProperty = await db.Property.findOne({
          where: { id: doc.id }
        });
        
        if (existingProperty) {
          console.log(`⏭️  Property ${doc.id} already exists, skipping`);
          continue;
        }

        await db.Property.create({
          id: doc.id,
          title: data.title,
          description: data.description,
          ownerId: data.ownerId || data.owner_id,
          ownerEmail: data.ownerEmail || data.owner_email,
          location: data.location,
          city: data.city,
          state: data.state,
          address: data.address,
          category: data.category,
          type: data.type,
          bedrooms: data.bedrooms || data.rooms,
          bathrooms: data.bathrooms || data.toilets,
          area: data.area || data.sqft,
          price: data.price,
          currency: data.currency || 'NGN',
          monthly_rent: data.monthly_rent || data.monthlyRent,
          annual_taxes: data.annual_taxes || data.annualTaxes,
          hoa_fees: data.hoa_fees || data.hoaFees,
          images: data.images,
          featuredImage: data.featuredImage || data.featured_image,
          coverImage: data.coverImage || data.cover_image,
          status: data.status || 'active',
          approvalStatus: data.approvalStatus || data.approval_status || 'pending',
          verificationStatus: data.verificationStatus || data.verification_status || 'pending',
          views: data.views || 0,
          inquiries_count: data.inquiries_count || data.inquiriesCount || 0,
          favorites_count: data.favorites_count || data.favoritesCount || 0,
          is_investment: data.is_investment || data.isInvestment || false,
          investment_data: data.investment_data || data.investmentData,
          documents: data.documents,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });

        migratedCount.properties++;
        console.log(`✅ Migrated property: ${data.title}`);
      } catch (error) {
        migrationErrors.push(`Property migration error: ${error.message}`);
        console.error(`❌ Error migrating property ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Properties migration completed: ${migratedCount.properties} properties migrated`);
  } catch (error) {
    console.error('❌ Properties collection migration failed:', error);
    migrationErrors.push(`Properties migration failed: ${error.message}`);
  }
}

/**
 * Migrate other collections (generic function)
 */
async function migrateCollection(collectionName, model) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  try {
    const snapshot = await admin.firestore().collection(collectionName).get();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        // Skip if document already exists
        const existing = await model.findByPk(data.id || doc.id);
        if (existing) {
          console.log(`⏭️  ${collectionName} ${doc.id} already exists, skipping`);
          continue;
        }

        // Create document with all data fields
        await model.create({
          id: data.id || doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });

        count++;
        console.log(`✅ Migrated ${collectionName} document: ${doc.id}`);
      } catch (error) {
        migrationErrors.push(`${collectionName} migration error: ${error.message}`);
        console.error(`❌ Error migrating ${collectionName} ${doc.id}:`, error.message);
      }
    }
    
    migratedCount.other += count;
    console.log(`✅ ${collectionName} migration completed: ${count} documents migrated`);
  } catch (error) {
    console.error(`❌ ${collectionName} collection migration failed:`, error);
    migrationErrors.push(`${collectionName} migration failed: ${error.message}`);
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Firestore → PostgreSQL Migration...\n');
  
  try {
    // Initialize database
    await db.sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Sync database (create tables if needed)
    console.log('📊 Syncing database tables...');
    await db.sequelize.sync({ alter: false });
    console.log('✅ Database tables synced\n');

    // Migrate collections
    await migrateUsers();
    await migrateProperties();
    
    // Migrate other collections
    await migrateCollection('investments', db.Investment);
    await migrateCollection('mortgageApplications', db.MortgageApplication);
    await migrateCollection('mortages', db.Mortgage);
    await migrateCollection('escrowTransactions', db.EscrowTransaction);
    await migrateCollection('userInvestments', db.UserInvestment);
    await migrateCollection('blog', db.Blog);
    await migrateCollection('supportInquiries', db.SupportInquiry);
    await migrateCollection('verificationApplications', db.VerificationApplication);
    await migrateCollection('messages', db.Message);
    await migrateCollection('notifications', db.Notification);
    await migrateCollection('savedProperties', db.SavedProperty);
    await migrateCollection('propertyInquiries', db.PropertyInquiry);
    await migrateCollection('propertyAlerts', db.PropertyAlert);
    await migrateCollection('disputeResolutions', db.DisputeResolution);
    await migrateCollection('inspectionRequests', db.InspectionRequest);
    await migrateCollection('mortgageBanks', db.MortgageBank);

    // Print summary
    console.log('\n\n📊 =========================== MIGRATION SUMMARY ===========================');
    console.log(`Users:       ${migratedCount.users}`);
    console.log(`Properties:  ${migratedCount.properties}`);
    console.log(`Other:       ${migratedCount.other}`);
    console.log(`Total:       ${migratedCount.users + migratedCount.properties + migratedCount.other}`);
    console.log('==========================================================================\n');

    if (migrationErrors.length > 0) {
      console.log('⚠️  Migration Errors:');
      migrationErrors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
