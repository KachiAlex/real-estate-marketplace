process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/placeholder';

const db = require('./backend/config/sequelizeDb');

db.Property.findAndCountAll = async () => ({ rows: [], count: 0 });
db.Property.count = async () => 0;

(async () => {
  const propertyService = require('./backend/services/propertyService');
  const result = await propertyService.listProperties({ limit: 5 });
  console.log(JSON.stringify({
    total: result.properties.length,
    mockCount: result.meta?.mockCount,
    stats: result.stats,
    sample: result.properties.slice(0, 2)
  }, null, 2));
})();
