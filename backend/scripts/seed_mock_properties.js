const { Sequelize } = require('sequelize');
const db = require('../config/sequelizeDb');
const fs = require('fs');

async function seed() {
  try {
    console.log('Connecting to DB...');
    await db.sequelize.authenticate();
    console.log('DB connected');

    const User = db.User;
    const Property = db.Property;

    // Create or find a mock user
    const [user, created] = await User.findOrCreate({
      where: { email: 'mock.vendor@example.com' },
      defaults: {
        firstName: 'Mock',
        lastName: 'Vendor',
        email: 'mock.vendor@example.com',
        password: 'password',
        role: 'vendor',
        roles: ['vendor'],
        activeRole: 'vendor',
        isVerified: true,
        vendorData: {}
      }
    });

    console.log('Mock user id:', user.id, 'created:', created);

    // Read mock properties from a local JSON if present, else create sample properties
    let properties = [];
    const samplePath = 'scripts/mock_properties.json';
    if (fs.existsSync(samplePath)) {
      properties = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    } else {
      properties = [
        {
          title: 'Mock Property One',
          description: 'A lovely mock property for testing.',
          price: 120000,
          status: 'for-sale',
          verificationStatus: 'verified',
          ownerId: user.id,
          vendorCode: user.vendorCode || null,
          views: 10
        },
        {
          title: 'Mock Property Two',
          description: 'Second mock listing.',
          price: 95000,
          status: 'for-sale',
          verificationStatus: 'verified',
          ownerId: user.id,
          vendorCode: user.vendorCode || null,
          views: 5
        }
      ];
    }

    for (const p of properties) {
      // Upsert by title+owner
      const [prop, pc] = await Property.findOrCreate({
        where: { title: p.title, ownerId: user.id },
        defaults: p
      });
      console.log('Upserted property:', prop.title);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
