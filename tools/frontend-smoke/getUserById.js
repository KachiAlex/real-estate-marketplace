#!/usr/bin/env node
// Usage: node getUserById.js <DATABASE_URL> <USER_ID>

const [,, databaseUrl, userId] = process.argv;
if (!databaseUrl || !userId) {
  console.error('Usage: node getUserById.js <DATABASE_URL> <USER_ID>');
  process.exit(2);
}

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(databaseUrl, {
  logging: (msg) => console.log('SQL:', msg),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

(async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    const sql = `SELECT * FROM users WHERE id = :id LIMIT 1`;
    const rows = await sequelize.query(sql, { replacements: { id: userId }, type: Sequelize.QueryTypes.SELECT });
    if (!rows || !rows.length) {
      console.log('User not found');
    } else {
      console.log('User record:');
      console.log(JSON.stringify(rows[0], null, 2));
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error querying user:', err && err.stack ? err.stack : err);
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
})();
