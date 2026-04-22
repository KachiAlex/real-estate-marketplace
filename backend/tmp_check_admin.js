(async ()=>{
  try{
    const db = require('./config/sequelizeDb');
    await db.sequelize.authenticate();
    const [rows] = await db.sequelize.query("SELECT id, email, role, roles, \"activeRole\", \"isActive\" FROM users WHERE email='admin@propertyark.com' LIMIT 1");
    console.log('ROW:', JSON.stringify(rows, null, 2));
    await db.sequelize.close();
    process.exit(0);
  }catch(e){
    console.error('ERROR:', e && (e.message || e));
    try{ if (global && global.process) process.exit(1);}catch(_){}
  }
})();
