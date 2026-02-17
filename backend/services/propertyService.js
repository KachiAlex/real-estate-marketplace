const db = require('../config/sequelizeDb');
const PropertyModel = db.Property;
const UserModel = db.User;

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
  const where = {};
  if (status) where.status = status;
  if (verificationStatus) where.verificationStatus = verificationStatus;

  if (search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } },
      { state: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const orderArr = [[sanitizeSortField(sort), order === 'asc' ? 'ASC' : 'DESC']];
  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await PropertyModel.findAndCountAll({ where, order: orderArr, offset, limit: Number(limit) });

  const stats = {
    total: await PropertyModel.count(),
    pending: await PropertyModel.count({ where: { verificationStatus: 'pending' } }),
    approved: await PropertyModel.count({ where: { verificationStatus: 'approved' } }),
    rejected: await PropertyModel.count({ where: { verificationStatus: 'rejected' } })
  };

  return {
    properties: rows.map(r => r.toJSON()),
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(count / Number(limit)) || 1,
      totalItems: count,
      itemsPerPage: Number(limit)
    },
    stats
  };
};

const getPropertyById = async (propertyId) => {
  const p = await PropertyModel.findByPk(propertyId);
  return p ? p.toJSON() : null;
};

const createProperty = async (propertyData) => {
  const payload = {
    ...propertyData,
    ownerId: propertyData.ownerId,
    images: propertyData.images || [],
    verificationStatus: propertyData.verificationStatus || 'pending',
    status: propertyData.status || 'for-sale'
  };
  const created = await PropertyModel.create(payload);
  return created.toJSON();
};

const updateProperty = async (propertyId, updates) => {
  const p = await PropertyModel.findByPk(propertyId);
  if (!p) return null;
  await p.update(updates);
  return (await PropertyModel.findByPk(propertyId)).toJSON();
};

const updatePropertyVerification = async (propertyId, { status, notes, adminId }) => {
  const p = await PropertyModel.findByPk(propertyId);
  if (!p) return null;
  await p.update({ verificationStatus: status, verificationNotes: notes || '', isVerified: status === 'approved', verifiedBy: adminId, verifiedAt: new Date() });
  return (await PropertyModel.findByPk(propertyId)).toJSON();
};

const deleteProperty = async (propertyId) => {
  await PropertyModel.destroy({ where: { id: propertyId } });
};

const toggleFavorite = async (propertyId, userId) => {
  const user = await UserModel.findByPk(userId);
  if (!user) throw new Error('User not found');
  const u = user.toJSON();
  const favorites = Array.isArray(u.favorites) ? [...u.favorites] : [];
  const idx = favorites.indexOf(propertyId);
  let isFavorited = false;
  if (idx >= 0) {
    favorites.splice(idx, 1);
    isFavorited = false;
  } else {
    favorites.push(propertyId);
    isFavorited = true;
  }
  await user.update({ favorites });

  // update property favorites_count
  const property = await PropertyModel.findByPk(propertyId);
  if (property) {
    const favorites_count = Math.max(0, (property.favorites_count || 0) + (isFavorited ? 1 : -1));
    await property.update({ favorites_count });
  }

  return { property: property ? property.toJSON() : null, favorites, isFavorited };
};

const getPropertyStats = async () => {
  return {
    total: await PropertyModel.count(),
    pending: await PropertyModel.count({ where: { verificationStatus: 'pending' } }),
    approved: await PropertyModel.count({ where: { verificationStatus: 'approved' } }),
    rejected: await PropertyModel.count({ where: { verificationStatus: 'rejected' } })
  };
};

const getPropertyStatusSummary = async () => {
  return await getPropertyStats();
};

const listRecentProperties = async (limit = 5) => {
  const rows = await PropertyModel.findAll({ order: [['createdAt', 'DESC']], limit: Number(limit) });
  return rows.map(r => r.toJSON());
};

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyVerification,
  deleteProperty,
  toggleFavorite,
  getPropertyStats,
  getPropertyStatusSummary,
  listRecentProperties
};

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
