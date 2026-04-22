const db = require('../config/sequelizeDb');

(async () => {
  try {
    await db.sequelize.authenticate();
    const [columns] = await db.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'support_inquiries' ORDER BY ordinal_position"
    );
    console.log('support_inquiries columns:', columns.map((c) => c.column_name));
  } catch (err) {
    console.error('Failed to inspect schema', err);
  } finally {
    await db.sequelize.close();
  }
})();
