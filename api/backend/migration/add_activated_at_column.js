const db = require('../config/sequelizeDb');

async function columnExists(columnName) {
  const sql = `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name = :col`;
  const rows = await db.sequelize.query(sql, { replacements: { col: columnName }, type: db.Sequelize.QueryTypes.SELECT });
  return rows && rows.length > 0;
}

async function run() {
  try {
    console.log('Connecting to DB...');
    await db.sequelize.authenticate();
    console.log('Connected');

    const col = 'activatedAt';
    const exists = await columnExists(col);
    if (exists) {
      console.log('Already exists:', col);
    } else {
      console.log('Creating column:', col);
      await db.sequelize.query(`ALTER TABLE "users" ADD COLUMN "${col}" TIMESTAMP`);
      console.log('Created column:', col);
    }

    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e.message || e);
    process.exit(1);
  }
}

run();
