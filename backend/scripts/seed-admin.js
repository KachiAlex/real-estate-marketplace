const bcrypt = require('bcryptjs');
const path = require('path');

// Ensure dotenv loads backend/.env when available
if (!process.env.DATABASE_URL) {
  const dotenvPath = path.resolve(__dirname, '..', '.env');
  require('dotenv').config({ path: dotenvPath });
} else {
  require('dotenv').config();
}

const db = require('../config/sequelizeDb');

async function seedAdmin() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ DB authenticated');

    // Ensure models are initialized
    await db.sequelize.sync();

    const email = process.env.ADMIN_FALLBACK_EMAIL || 'admin@propertyark.com';
    const plainPassword = process.env.ADMIN_FALLBACK_PASSWORD || 'admin123';

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const [user, created] = await db.User.findOrCreate({
      where: { email: email.toLowerCase() },
      defaults: {
        email: email.toLowerCase(),
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        roles: ['admin'],
        provider: 'email',
        isVerified: true,
        isActive: true
      }
    });

    if (!created) {
      // Update password and role if user already exists
      await user.update({ password: passwordHash, role: 'admin', roles: ['admin'] });
      console.log(`🔁 Updated admin user: ${email}`);
    } else {
      console.log(`✅ Created admin user: ${email}`);
    }

    console.log('Admin seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
    process.exit(1);
  }
}

seedAdmin();
