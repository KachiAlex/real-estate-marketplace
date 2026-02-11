const { Client } = require('pg');
(async ()=>{
  try{
    const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION || null;
    const host = process.env.PGHOST || 'dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com';
    const user = process.env.PGUSER || 'propertyark_user';
    const password = process.env.PGPASSWORD || 'oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej';
    const database = process.env.PGDATABASE || 'propertyark';
    const port = process.env.PGPORT ? parseInt(process.env.PGPORT,10) : 5432;
    const sslMode = (process.env.PGSSLMODE || 'require').toLowerCase();

    const clientConfig = connectionString
      ? { connectionString }
      : { host, user, password, database, port };

    if (sslMode === 'require' || sslMode === 'true') {
      clientConfig.ssl = { rejectUnauthorized: false };
    }

    const client = new Client(clientConfig);
    await client.connect();
    const res = await client.query('SELECT now() as now');
    console.log('OK: Connected to Postgres  now =', res.rows[0].now);
    await client.end();
  } catch (e) {
    console.error('ERR:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
