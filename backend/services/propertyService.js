const { getFirestore, admin } = require('../config/firestore');
const mockProperties = require('../data/mockProperties');

const COLLECTION = 'properties';
let seedInitialized = false;

const convertTimestamp = (value) => {
  if (!value) return value;
  return value.toDate ? value.toDate() : value;
};

const convertPropertyDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;

  return {
    id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    verifiedAt: convertTimestamp(data.verifiedAt),
    listedAt: convertTimestamp(data.listedAt)
  };
};

const ensureSeedProperties = async () => {
  if (seedInitialized) return;
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const snapshot = await db.collection(COLLECTION).limit(1).get();
  if (!snapshot.empty) {
    seedInitialized = true;
    return;
  }

  const batch = db.batch();
  mockProperties.forEach((property) => {
    const docRef = db.collection(COLLECTION).doc(property.id);
    batch.set(docRef, {
      ...property,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationStatus: property.verificationStatus || 'pending'
    });
  });

  await batch.commit();
  seedInitialized = true;
};

const getPropertyCounts = async (db) => {
  const collectionRef = db.collection(COLLECTION);
  const total = await collectionRef.count().get();
  const pending = await collectionRef.where('verificationStatus', '==', 'pending').count().get();
  const approved = await collectionRef.where('verificationStatus', '==', 'approved').count().get();
  const rejected = await collectionRef.where('verificationStatus', '==', 'rejected').count().get();

  return {
    total: total.data().count,
    pending: pending.data().count,
    approved: approved.data().count,
    rejected: rejected.data().count
  };
};

const sanitizeSortField = (field) => {
  const allowed = ['createdAt', 'price', 'title'];
  return allowed.includes(field) ? field : 'createdAt';
};

const listProperties = async ({
  status,
  verificationStatus,
  page = 1,
  limit = 20,
  search,
  sort = 'createdAt',
  order = 'desc'
} = {}) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  await ensureSeedProperties();

  let filterQuery = db.collection(COLLECTION);

  if (status) {
    filterQuery = filterQuery.where('status', '==', status);
  }
  if (verificationStatus) {
    filterQuery = filterQuery.where('verificationStatus', '==', verificationStatus);
  }

  const direction = order === 'asc' ? 'asc' : 'desc';
  const sortField = sanitizeSortField(sort);
  let query = filterQuery.orderBy(sortField, direction);

  const skip = (Number(page) - 1) * Number(limit);
  const snapshot = await query.offset(skip).limit(Number(limit)).get();

  let properties = snapshot.docs.map(convertPropertyDoc);

  if (search) {
    const lowerSearch = search.toLowerCase();
    properties = properties.filter((property) => (
      property.title?.toLowerCase().includes(lowerSearch) ||
      property.description?.toLowerCase().includes(lowerSearch) ||
      property.location?.city?.toLowerCase().includes(lowerSearch) ||
      property.location?.state?.toLowerCase().includes(lowerSearch)
    ));
  }

  const [{ data: totalData }] = await Promise.all([
    filterQuery.count().get()
  ]);

  const stats = await getPropertyCounts(db);
  const totalItems = totalData.count;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  return {
    properties,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalItems,
      itemsPerPage: Number(limit)
    },
    stats
  };
};

const getPropertyById = async (propertyId) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const doc = await db.collection(COLLECTION).doc(propertyId).get();
  return doc.exists ? convertPropertyDoc(doc) : null;
};

const createProperty = async (propertyData) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = db.collection(COLLECTION).doc();
  const payload = {
    ...propertyData,
    id: docRef.id,
    favorites: propertyData.favorites || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    verificationStatus: propertyData.verificationStatus || 'pending',
    status: propertyData.status || 'for-sale'
  };

  await docRef.set(payload);
  const saved = await docRef.get();
  return convertPropertyDoc(saved);
};

const updateProperty = async (propertyId, updates) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = db.collection(COLLECTION).doc(propertyId);
  const payload = {
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await docRef.set(payload, { merge: true });

  const updated = await docRef.get();
  return convertPropertyDoc(updated);
};

const updatePropertyVerification = async (propertyId, { status, notes, adminId }) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  await ensureSeedProperties();

  const docRef = db.collection(COLLECTION).doc(propertyId);
  const existing = await docRef.get();
  if (!existing.exists) {
    return null;
  }

  await docRef.set({
    verificationStatus: status,
    verificationNotes: notes || '',
    isVerified: status === 'approved',
    verifiedBy: adminId,
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const updated = await docRef.get();
  return convertPropertyDoc(updated);
};

const deleteProperty = async (propertyId) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  await db.collection(COLLECTION).doc(propertyId).delete();
};

const toggleFavorite = async (propertyId, userId) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = db.collection(COLLECTION).doc(propertyId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  const favorites = Array.isArray(data.favorites) ? [...data.favorites] : [];
  const normalizedUserId = String(userId);
  const userIndex = favorites.indexOf(normalizedUserId);
  let isFavorited;

  if (userIndex >= 0) {
    favorites.splice(userIndex, 1);
    isFavorited = false;
  } else {
    favorites.push(normalizedUserId);
    isFavorited = true;
  }

  await docRef.update({
    favorites,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    ...convertPropertyDoc(snapshot),
    favorites,
    isFavorited
  };
};

const getPropertyStats = async () => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  await ensureSeedProperties();
  return await getPropertyCounts(db);
};

const getPropertyStatusSummary = async () => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');
  await ensureSeedProperties();
  return await getPropertyCounts(db);
};

const listRecentProperties = async (limit = 5) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  await ensureSeedProperties();

  const snapshot = await db.collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(convertPropertyDoc);
};

const deletePropertiesByOwner = async (ownerId) => {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const snapshot = await db.collection(COLLECTION)
    .where('owner.id', '==', ownerId)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyVerification,
  deleteProperty,
  getPropertyStats,
  getPropertyStatusSummary,
  deletePropertiesByOwner,
  listRecentProperties,
  toggleFavorite,
  ensureSeedProperties
};
