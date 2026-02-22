#!/usr/bin/env node
/*
  Usage: node run_add_verified_migration.js "<DATABASE_URL>" <DB_REQUIRE_SSL:true|false> <DB_REJECT_UNAUTHORIZED:true|false>
  Example:
    node run_add_verified_migration.js "postgresql://user:pass@host/db" true false
*/
const path = require('path');

const dbUrl = process.argv[2];
const dbRequireSsl = process.argv[3] === 'true';
const dbRejectUnauthorized = process.argv[4] !== 'false';

if (!dbUrl) {
  console.error('Usage: node run_add_verified_migration.js "<DATABASE_URL>" <DB_REQUIRE_SSL:true|false> <DB_REJECT_UNAUTHORIZED:true|false>');
  process.exit(1);
}

process.env.DATABASE_URL = dbUrl;
process.env.DB_REQUIRE_SSL = dbRequireSsl ? 'true' : 'false';
process.env.DB_REJECT_UNAUTHORIZED = dbRejectUnauthorized ? 'true' : 'false';

console.log('Running add_verified_to_verification_enums.js with:');
console.log('DATABASE_URL=', dbUrl);
console.log('DB_REQUIRE_SSL=', process.env.DB_REQUIRE_SSL);
console.log('DB_REJECT_UNAUTHORIZED=', process.env.DB_REJECT_UNAUTHORIZED);

// Require the migration file which executes on load
require(path.join(__dirname, 'add_verified_to_verification_enums.js'));
