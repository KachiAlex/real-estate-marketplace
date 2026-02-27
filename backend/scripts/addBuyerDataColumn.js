const db = require('../config/sequelizeDb');

async function addBuyerDataColumn() {
  try {
    console.log('🔄 Adding buyerData column to users table...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Add the buyerData column if it doesn't exist
    const query = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS "buyerData" JSON;
    `;
    
    await db.sequelize.query(query);
    console.log('✅ buyerData column added successfully');
    
    // Close connection
    await db.sequelize.close();
    console.log('🔒 Database connection closed');
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  addBuyerDataColumn();
}

module.exports = { addBuyerDataColumn };
