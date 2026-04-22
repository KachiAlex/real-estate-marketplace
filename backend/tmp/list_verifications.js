const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const db = require('../config/sequelizeDb');
(async function(){
  await db.sequelize.authenticate();
  const vendorId = 'eb7915b7-96b0-429f-9169-49fa128d6873';
  const rows = await db.VerificationApplication.findAll({ where: { vendorId }, order: [['createdAt','DESC']], limit: 10 });
  console.log('found', rows.length);
  console.log(rows.map(r=> ({ id: r.id, propertyId: r.propertyId, verificationStatus: r.verificationStatus, createdAt: r.createdAt })));
  process.exit(0);
})();
