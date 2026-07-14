#!/usr/bin/env node
require('dotenv').config();
const db = require('../config/sequelizeDb');
const { Sequelize } = require('sequelize');

const STATUS_ENUM = 'enum_subscriptions_status';
const REQUIRED_VALUES = [
  'trial',
  'pending',
  'active',
  'pending_payment',
  'payment_failed',
  'expired',
  'cancelled',
  'suspended',
  'inactive'
];

async function ensureSubscriptionStatuses() {
  let sequelize = db.sequelize;
  const dbUrl = process.env.DATABASE_URL || '';

  try {
    if (dbUrl.includes('render.com')) {
      sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      });
      await sequelize.authenticate();
      console.log('Connected to Render DB with SSL');
    } else {
      await sequelize.authenticate();
      console.log('Connected to DB');
    }

    for (const value of REQUIRED_VALUES) {
      console.log(`Ensuring '${value}' exists on ${STATUS_ENUM}`);
      await sequelize.query(`DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = '${STATUS_ENUM}' AND e.enumlabel = '${value}'
          ) THEN
            ALTER TYPE "${STATUS_ENUM}" ADD VALUE '${value}';
          END IF;
        END
      $$;`);
    }

    console.log('Subscription status enum values ensured.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to ensure subscription status enum values:', error.message || error);
    process.exit(1);
  }
}

ensureSubscriptionStatuses();
