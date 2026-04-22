const { Client } = require('pg');

async function ensureSubscriptionColumns() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  const queries = [
    // Allow planId and endDate to be nullable for fallback/default plans
    'ALTER TABLE subscriptions ALTER COLUMN "planId" DROP NOT NULL',
    'ALTER TABLE subscriptions ALTER COLUMN "endDate" DROP NOT NULL',

    // Add missing columns if they do not exist yet
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'plan'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "plan" VARCHAR(255);
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'amount'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "amount" NUMERIC(12,2) NOT NULL DEFAULT 0;
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'currency'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN';
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'trialEndDate'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "trialEndDate" TIMESTAMP WITH TIME ZONE;
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'paymentMethod'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "paymentMethod" VARCHAR(50) NOT NULL DEFAULT 'paystack';
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'lastPaymentAttempt'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "lastPaymentAttempt" TIMESTAMP WITH TIME ZONE;
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'suspensionReason'
      ) THEN
        ALTER TABLE subscriptions ADD COLUMN "suspensionReason" TEXT;
      END IF;
    END $$;`,

    // Ensure sensible defaults for existing rows
    `UPDATE subscriptions SET "plan" = COALESCE("plan", 'Vendor Monthly Plan')`,
    `UPDATE subscriptions SET "amount" = CASE WHEN COALESCE("amount", 0) = 0 THEN 50000 ELSE "amount" END`,
    `UPDATE subscriptions SET "currency" = COALESCE(NULLIF(TRIM("currency"), ''), 'NGN')`,
    `UPDATE subscriptions SET "paymentMethod" = COALESCE(NULLIF(TRIM("paymentMethod"), ''), 'paystack')`
  ];

  try {
    await client.connect();
    for (const query of queries) {
      await client.query(query);
    }
    console.log('Subscription columns ensured successfully.');
  } finally {
    await client.end();
  }
}

ensureSubscriptionColumns().catch((err) => {
  console.error('Failed to ensure subscription columns:', err.message || err);
  process.exit(1);
});
