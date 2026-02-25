(async () => {
  try {
    // Set the DATABASE_URL for this script
    process.env.DATABASE_URL = 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';
    process.env.DB_REQUIRE_SSL = 'true';

    // Increase stack trace for debugging
    Error.stackTraceLimit = 50;

    const db = require('../backend/config/sequelizeDb');
    const User = db.User;

    // Wait for sequelize to connect (retry logic runs in config, but we ensure auth)
    let connected = false;
    for (let i = 0; i < 10; i++) {
      try {
        await db.sequelize.authenticate();
        connected = true;
        break;
      } catch (e) {
        process.stdout.write('.')
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!connected) {
      console.error('\nFailed to connect to database');
      process.exit(2);
    }

    const userId = '01459fe3-80b9-467d-8415-fc261226faa7';
    const user = await User.findByPk(userId, { raw: true });
    if (!user) {
      console.log('User not found for id', userId);
      process.exit(0);
    }

    const output = {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
      activeRole: user.activeRole,
      vendorData: user.vendorData
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
