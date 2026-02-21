const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');
    const cols = await db.sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`, { type: db.sequelize.QueryTypes.SELECT });
    console.log(cols.map(c => c.column_name));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
