const { initializeFirestore, getFirestore, admin } = require('../config/firestore');
const bcrypt = require('bcryptjs');
const mockUsers = require('../data/mockUsers');
const mockProperties = require('../data/mockProperties');

const USERS_COLLECTION = 'users';
const PROPERTIES_COLLECTION = 'properties';

const normalizeUserDoc = async (user) => {
  const { password, ...rest } = user;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  return {
    ...rest,
    email: user.email.toLowerCase(),
    role: user.role || 'user',
    roles: user.roles || (user.role ? [user.role] : ['user']),
    password: hashedPassword,
    isVerified: user.isVerified !== undefined ? user.isVerified : true,
    isActive: user.isActive !== undefined ? user.isActive : true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp()
  };
};

const seedUsers = async (db) => {
  console.log('\n👤 Seeding users...');
  for (const user of mockUsers) {
    const docRef = db.collection(USERS_COLLECTION).doc(user.id);
    const payload = await normalizeUserDoc(user);
    await docRef.set(payload, { merge: true });
    console.log(`   • ${user.email}`);
  }
  console.log('✅ Users seeded');
};

const seedProperties = async (db) => {
  console.log('\n🏡 Seeding properties...');
  const batch = db.batch();

  mockProperties.forEach((property) => {
    const docRef = db.collection(PROPERTIES_COLLECTION).doc(property.id);
    batch.set(docRef, {
      ...property,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationStatus: property.verificationStatus || 'pending',
      status: property.status || 'for-sale'
    }, { merge: true });
  });

  await batch.commit();
  console.log('✅ Properties seeded');
};

(async () => {
  try {
    console.log('🚀 Initializing Firestore...');
    initializeFirestore();
    const db = getFirestore();

    await seedUsers(db);
    await seedProperties(db);

    console.log('\n🎉 Firestore seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firestore seeding failed:', error);
    process.exit(1);
  }
})();
