const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const email = process.argv[2] || `local+${Date.now()}@example.com`;
const password = process.argv[3] || 'Passw0rd!';

(async () => {
  try {
    const usersPath = path.resolve(__dirname, '..', 'backend', 'data', 'local_users.json');
    let users = [];
    if (fs.existsSync(usersPath)) {
      try { users = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]'); } catch (e) { users = []; }
    }
    const id = `local-${Date.now()}`;
    const hashed = await bcrypt.hash(password, 10);
    const user = { id, email: email.toLowerCase(), password: hashed, firstName: 'Local', lastName: 'User', role: 'user', roles: ['user'], createdAt: new Date(), updatedAt: new Date() };
    users.push(user);
    fs.mkdirSync(path.dirname(usersPath), { recursive: true });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('Created local user:', email, 'password:', password);
    process.exit(0);
  } catch (e) {
    console.error('Failed to create local user', e);
    process.exit(2);
  }
})();
