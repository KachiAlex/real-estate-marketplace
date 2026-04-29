const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    console.log('Connecting to DB...');
    await client.connect();
    console.log('Connected!');

    // Check current state
    console.log('\n📋 BEFORE UPDATE:');
    const before = await client.query(
      `SELECT id, email, role, roles, "activeRole", "updatedAt" FROM users WHERE email = $1;`,
      ['admin@propertyark.com']
    );
    if (before.rows.length === 0) {
      console.error('❌ User admin@propertyark.com not found');
      await client.end();
      process.exit(1);
    }
    console.log(JSON.stringify(before.rows[0], null, 2));

    // Update to admin
    console.log('\n🔧 UPDATING admin user to role=admin...');
    await client.query(
      `UPDATE users 
       SET role = $1, 
           roles = $2::json, 
           "activeRole" = $3,
           "updatedAt" = now()
       WHERE email = $4;`,
      ['admin', '["admin"]', 'admin', 'admin@propertyark.com']
    );
    console.log('✅ Updated!');

    // Verify change
    console.log('\n✅ AFTER UPDATE:');
    const after = await client.query(
      `SELECT id, email, role, roles, "activeRole", "updatedAt" FROM users WHERE email = $1;`,
      ['admin@propertyark.com']
    );
    console.log(JSON.stringify(after.rows[0], null, 2));

    console.log('\n🎉 Admin role restored successfully!');
    console.log('Next: Sign out and sign back in to refresh the token.');
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
})();
