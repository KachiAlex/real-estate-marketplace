(async () => {
  try {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';
    process.env.DB_REQUIRE_SSL = 'true';

    const db = require('../backend/config/sequelizeDb');
    const User = db.User;

    // Wait for DB connect
    for (let i = 0; i < 10; i++) {
      try {
        await db.sequelize.authenticate();
        break;
      } catch (e) {
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const userId = '01459fe3-80b9-467d-8415-fc261226faa7';
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('User not found:', userId);
      process.exit(2);
    }

    let roles = Array.isArray(user.roles) ? user.roles.map(r => String(r).toLowerCase()) : [String(user.role || 'user').toLowerCase()];
    if (!roles.includes('vendor')) {
      roles.push('vendor');
    } else {
      console.log('User already has vendor in roles');
    }

    // normalize: ensure 'user' present
    if (!roles.includes('user')) roles.push('user');

    await user.update({ roles });

    console.log('Updated user roles:', roles);
    process.exit(0);
  } catch (err) {
    console.error('Error updating roles:', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
