process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/placeholder';

const db = require('./backend/config/sequelizeDb');

(async () => {
  try {
    db.User.findAndCountAll = async () => ({ rows: [], count: 0 });

    const userService = require('./backend/services/userService');
    const result = await userService.listUsers({ limit: 50 });
    console.log(JSON.stringify({
      totalUsers: result.users.length,
      mockCount: result.meta?.mockCount,
      realCount: result.meta?.realCount,
      sample: result.users
    }, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
