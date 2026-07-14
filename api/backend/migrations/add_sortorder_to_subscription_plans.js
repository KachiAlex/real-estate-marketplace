const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

async function addSortOrderToSubscriptionPlans() {
  let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    // Fall back to local database for development
    if (process.env.NODE_ENV === 'development' || process.env.USE_LOCAL_DB === 'true') {
      const localPort = process.env.DB_PORT || 15432;
      const localUser = process.env.DB_USER || 'postgres';
      const localPass = process.env.DB_PASSWORD || 'password';
      const localDb = process.env.DB_NAME || 'real_estate_db';
      connectionString = `postgresql://${localUser}:${localPass}@localhost:${localPort}/${localDb}`;
      console.log('Using local database for migration');
    } else {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
    }
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  const queries = [
    // Add sortOrder column if it doesn't exist
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'sortOrder'
      ) THEN
        ALTER TABLE subscription_plans ADD COLUMN "sortOrder" INTEGER DEFAULT 0;
      END IF;
    END $$;`,
  ];

  try {
    await client.connect();
    for (const query of queries) {
      await client.query(query);
    }
    console.log('sortOrder column added to subscription_plans successfully.');
  } finally {
    await client.end();
  }
}

addSortOrderToSubscriptionPlans().catch((err) => {
  console.error('Failed to add sortOrder column:', err.message || err);
  process.exit(1);
});
