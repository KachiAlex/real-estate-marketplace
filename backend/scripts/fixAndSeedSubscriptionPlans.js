const { Sequelize } = require('sequelize');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Fix id column default if missing
    await sequelize.query(`
      ALTER TABLE "subscription_plans" 
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
    `);
    console.log('Set default UUID on id column');

    const [existing] = await sequelize.query('SELECT COUNT(*) FROM "subscription_plans"');
    const count = parseInt(existing[0].count, 10);
    console.log(`Existing plans: ${count}`);

    if (count === 0) {
      await sequelize.query(`
        INSERT INTO "subscription_plans" ("name", "description", "price", "currency", "billingCycle", "features", "maxProperties", "maxImages", "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES
          ('Basic', 'Perfect for individual agents', 5000.00, 'NGN', 'monthly', '["5 listings","Email support","Basic analytics"]', 5, 5, true, 1, NOW(), NOW()),
          ('Professional', 'For growing real estate businesses', 15000.00, 'NGN', 'monthly', '["25 listings","Priority support","Advanced analytics","Featured listings"]', 25, 10, true, 2, NOW(), NOW()),
          ('Enterprise', 'For large agencies and developers', 50000.00, 'NGN', 'monthly', '["Unlimited listings","24/7 support","Full analytics","Featured listings","API access"]', 999, 20, true, 3, NOW(), NOW())
      `);
      console.log('Default subscription plans seeded');
    } else {
      console.log('Plans already exist, skipping seed');
    }

    await sequelize.close();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
