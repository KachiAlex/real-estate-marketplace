const db = require('../config/sequelizeDb');
const { sequelize } = db;

async function inspect() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const [cols] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties' ORDER BY ordinal_position;");
    console.log('\nProperties table columns:');
    cols.forEach(c => console.log(`  ${c.column_name} : ${c.data_type}`));

    const enumNames = ['enum_properties_type','enum_properties_status','enum_properties_approvalstatus','enum_properties_verificationstatus','enum_properties_approvalStatus','enum_properties_verificationStatus'];
    for (const en of enumNames) {
      try {
        const [rows] = await sequelize.query(`SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = '${en}' ORDER BY enumsortorder;`);
        if (rows.length) {
          console.log(`\nEnum ${en}: ${rows.map(r => r.enumlabel).join(', ')}`);
        } else {
          console.log(`\nEnum ${en}: (not found)`);
        }
      } catch (e) {
        console.log(`\nEnum ${en}: query error: ${e.message}`);
      }
    }

    const [types] = await sequelize.query("SELECT t.typname FROM pg_type t WHERE t.typname LIKE 'enum_properties%';");
    console.log('\nFound enum types:');
    types.forEach(t => console.log('  ' + t.typname));

    process.exit(0);
  } catch (err) {
    console.error('Inspect failed:', err.message || err);
    process.exit(1);
  }
}

inspect();
