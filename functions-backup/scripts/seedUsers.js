const { initializeFirestore, getFirestore, admin } = require('../config/firestore');
const bcrypt = require('bcryptjs');
const mockUsers = require('../data/mockUsers');

const COLLECTION = 'users';

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

const seedUsers = async () => {
  try {
    initializeFirestore();
    const db = getFirestore();
    console.log('🚀 Seeding users into Firestore...');

    for (const user of mockUsers) {
      const docRef = db.collection(COLLECTION).doc(user.id);
      const payload = await normalizeUserDoc(user);
      await docRef.set(payload, { merge: true });
      console.log(`✅ Upserted ${user.email}`);
    }

    console.log('🎉 User seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
