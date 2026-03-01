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
  order = 'desc',
  ownerId
} = {}) => {
  const fs = require('fs');
  const path = require('path');
  const logPath = path.resolve(__dirname, '..', 'server_error.log');
  try {
  const where = {};
  if (status) where.status = status;
  if (verificationStatus) where.verificationStatus = verificationStatus;
  if (ownerId) where.ownerId = ownerId;

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
    verified: await PropertyModel.count({ where: { verificationStatus: 'verified' } }),
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
  } catch (err) {
    try {
      const details = {
        message: err.message,
        name: err.name,
        stack: err.stack,
        sql: err.sql || (err.parent && err.parent.sql) || null,
        parent: err.parent && (err.parent.message || err.parent.detail) || null,
        original: err.original && err.original.message || null
      };
      const entry = `[${new Date().toISOString()}] propertyService.listProperties error:\n${JSON.stringify(details, null, 2)}\n---\n`;
      fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
    } catch (fsErr) {
      // ignore
    }
    throw err;
  }
};

const getPropertyById = async (propertyId) => {
  const p = await PropertyModel.findByPk(propertyId);
  return p ? p.toJSON() : null;
};

const mapPropertyType = (frontendType) => {
  const typeMap = {
    'house': 'residential',
    'apartment': 'residential',
    'condo': 'residential',
    'townhouse': 'residential',
    'land': 'residential',
    'commercial': 'commercial',
    'agricultural': 'agricultural',
    'mixed-use': 'mixed-use'
  };
  return typeMap[frontendType] || 'residential';
};

const mapPropertyStatus = (frontendStatus) => {
  const statusMap = {
    'for-sale': 'active',
    'for-rent': 'active',
    'for-lease': 'active',
    'for-mortgage': 'active',
    'for-investment': 'active',
    'sold': 'sold',
    'rented': 'inactive',
    'active': 'active',
    'inactive': 'inactive',
    'pending': 'pending'
  };
  return statusMap[frontendStatus] || 'active';
};

const createProperty = async (propertyData) => {
  try {
    const payload = {
      title: propertyData.title,
      description: propertyData.description,
      price: parseFloat(propertyData.price),
      type: mapPropertyType(propertyData.type),
      status: mapPropertyStatus(propertyData.status),
      ownerId: propertyData.owner?.id || propertyData.ownerId,
      ownerEmail: propertyData.owner?.email || propertyData.ownerEmail,
      // Flatten location object into individual fields
      location: propertyData.location?.address || propertyData.location?.googleMapsUrl || '',
      address: propertyData.location?.address || '',
      city: propertyData.location?.city || '',
      state: propertyData.location?.state || '',
      // Details
      bedrooms: parseInt(propertyData.details?.bedrooms) || null,
      bathrooms: parseInt(propertyData.details?.bathrooms) || null,
      area: parseFloat(propertyData.details?.sqft) || null,
      // Media
      images: JSON.stringify(propertyData.images || []),
      videos: JSON.stringify(propertyData.videos || []),
      documents: JSON.stringify(propertyData.documentation || []),
      // Status fields
      verificationStatus: propertyData.verificationStatus || 'pending',
      approvalStatus: propertyData.approvalStatus || 'pending',
      category: propertyData.category || propertyData.type
    };
    
    const created = await PropertyModel.create(payload);
    return created.toJSON();
  } catch (error) {
    console.error('Error in createProperty:', error);
    throw error;
  }
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
  await p.update({ verificationStatus: status, verificationNotes: notes || '', isVerified: status === 'verified', verifiedBy: adminId, verifiedAt: new Date() });
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
  listRecentProperties,
  ensureSeedProperties: async () => {} // stub for dashboard seed logic
};

// deletePropertiesByOwner removed — use Sequelize `Property.destroy({ where: { ownerId } })` instead.

