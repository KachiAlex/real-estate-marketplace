(async ()=>{
  try{
    const db = require('./config/sequelizeDb');
    await db.sequelize.authenticate();
    const email = 'admin@propertyark.com';

    // Fetch current roles
    const [rows] = await db.sequelize.query('SELECT roles FROM users WHERE email = :email LIMIT 1', { replacements: { email }, type: db.sequelize.QueryTypes.SELECT });
    let currentRoles = (rows && rows.roles) ? rows.roles : [];
    if (typeof currentRoles === 'string') {
      try { currentRoles = JSON.parse(currentRoles); } catch (e) { currentRoles = [String(currentRoles)]; }
    }
    currentRoles = Array.isArray(currentRoles) ? currentRoles.map(r => String(r).toLowerCase()) : [String(currentRoles)];
    if (!currentRoles.includes('admin')) currentRoles.push('admin');
    currentRoles = Array.from(new Set(currentRoles));

    // Perform update
    const rolesJson = JSON.stringify(currentRoles);
    await db.sequelize.query('UPDATE users SET role = :role, roles = :roles::json, "activeRole" = :activeRole, "updatedAt" = now() WHERE email = :email', { replacements: { role: 'admin', roles: rolesJson, activeRole: 'admin', email } });

    const [newRow] = await db.sequelize.query('SELECT id,email,role,roles,"activeRole","isActive" FROM users WHERE email = :email LIMIT 1', { replacements: { email }, type: db.sequelize.QueryTypes.SELECT });
    console.log('UPDATED:', JSON.stringify(newRow, null, 2));
    await db.sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e && (e.message || e));
    try { process.exit(1); } catch (ignore) {}
  }
})();
