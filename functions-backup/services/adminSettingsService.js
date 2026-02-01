const { getFirestore, admin } = require('../config/firestore');

const COLLECTION = 'adminSettings';
const DOC_ID = 'global';

const DEFAULT_SETTINGS = {
  verificationFee: 50000,
  verificationBadgeColor: '#10B981',
  vendorListingFee: 100000,
  escrowTimeoutDays: 7,
  platformFee: 0.025,
  maxFileSize: 10485760,
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maintenanceMode: false,
  emailNotifications: true,
  smsNotifications: false,
  autoApproveProperties: false,
  autoApproveUsers: false
};

const ensureSettingsDoc = async (db) => {
  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    await docRef.set({
      ...DEFAULT_SETTINGS,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return (await docRef.get()).data();
  }

  return snapshot.data();
};

const getSettings = async () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const data = await ensureSettingsDoc(db);
  return {
    id: DOC_ID,
    ...data
  };
};

const updateSettings = async (updates) => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const docRef = db.collection(COLLECTION).doc(DOC_ID);
  await ensureSettingsDoc(db);

  await docRef.set({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const snapshot = await docRef.get();
  return {
    id: DOC_ID,
    ...snapshot.data()
  };
};

module.exports = {
  getSettings,
  updateSettings
};
