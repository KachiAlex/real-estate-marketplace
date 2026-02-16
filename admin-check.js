
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark'
});

async function createAdmin2() {
  await client.connect();
  const email = 'admin2@propertyark.com';
  const password = 'securepassword'; // Replace with a hashed password in production
  const role = 'admin';
  const roles = ['admin'];
  const isadmin = true;

  // Check if user already exists
  const res = await client.query("SELECT email FROM users WHERE email = $1", [email]);
  if (res.rows.length === 0) {
    await client.query(
      "INSERT INTO users (email, password, role, roles, isadmin) VALUES ($1, $2, $3, $4, $5)",
      [email, password, role, JSON.stringify(roles), isadmin]
    );
    console.log('Admin2 account created:', { email, role, roles, isadmin });
  } else {
    await client.query(
      "UPDATE users SET role = $2, roles = $3, isadmin = $4 WHERE email = $1",
      [email, role, JSON.stringify(roles), isadmin]
    );
    console.log('Admin2 account updated:', { email, role, roles, isadmin });
  }
  await client.end();
}

createAdmin2();
