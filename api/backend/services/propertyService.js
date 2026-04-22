const { Op } = require('sequelize');
const db = require('../config/sequelizeDb');
const PropertyModel = db.Property;
const UserModel = db.User;
const mockPropertiesData = require('../data/mockProperties');
const mockPropertyOverrides = new Map();

const createEmptyPropertyStats = () => ({
  total: 0,
  pending: 0,
  verified: 0,
  rejected: 0,
  active: 0,
  inactive: 0,
  sold: 0
});

const deriveVerificationStatusFromState = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'verified';
    case 'sold':
    case 'inactive':
      return 'rejected';
    case 'pending':
    default:
      return 'pending';
  }
};

const incrementStatsCounters = (stats, property = {}, count = 1) => {
  if (!stats || !count) return;

  stats.total += count;

  const normalizedStatus = (property.status || '').toLowerCase();
  if (normalizedStatus === 'active') {
    stats.active += count;
  } else if (normalizedStatus === 'inactive') {
    stats.inactive += count;
  } else if (normalizedStatus === 'sold') {
    stats.sold += count;
  }

  const verification = (property.verificationStatus || deriveVerificationStatusFromState(normalizedStatus)).toLowerCase();
  if (verification === 'verified') {
    stats.verified += count;
  } else if (verification === 'rejected') {
    stats.rejected += count;
  } else {
    stats.pending += count;
  }
};

const mergeStats = (first = {}, second = {}) => {
  const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
  return Array.from(keys).reduce((acc, key) => {
    acc[key] = (first[key] || 0) + (second[key] || 0);
    return acc;
  }, {});
};

const mapVerificationStatusToDbStatuses = (verificationStatus) => {
  switch ((verificationStatus || '').toLowerCase()) {
    case 'pending':
      return ['pending'];
    case 'verified':
      return ['active'];
    case 'rejected':
      return ['inactive', 'sold'];
    default:
      return null;
  }
};

const getDatabasePropertyStats = async () => {
  try {
    const rows = await PropertyModel.findAll({
      attributes: [
        'status',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    return rows.reduce((acc, row) => {
      const status = row.get ? row.get('status') : row.status;
      const count = Number((row.get && row.get('count')) || row.count || 0);
      incrementStatsCounters(acc, { status }, count);
      return acc;
    }, createEmptyPropertyStats());
  } catch (error) {
    console.warn('propertyService: failed to aggregate DB property stats, returning zeros', error.message);
    return createEmptyPropertyStats();
  }
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const parseJsonArray = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const normalizeImageEntry = (image) => {
  if (!image && image !== 0) return null;
  if (typeof image === 'string') {
    return { url: image, secure_url: image };
  }
  if (typeof image === 'object') {
    const url = image.url || image.secure_url || image.path || image.src;
    if (!url) return null;
    return {
      ...image,
      url,
      secure_url: image.secure_url || url,
    };
  }
  return null;
};

const normalizeImagesArray = (images) => {
  const array = parseJsonArray(images);
  return array.map(normalizeImageEntry).filter(Boolean);
};

const getFirstImageUrl = (images, fallback) => {
  const normalized = normalizeImagesArray(images);
  const first = normalized[0];
  if (first) {
    if (typeof first === 'string') return first;
    if (first.url) return first.url;
    if (first.secure_url) return first.secure_url;
  }
  return isNonEmptyString(fallback) ? fallback : null;
};

const parseIntegerField = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseDecimalField = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const stringifyIfNeeded = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (err) {
    return JSON.stringify([]);
  }
};

const mapPropertyType = (frontendType) => {
  if (!frontendType) return undefined;
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
  return typeMap[String(frontendType).toLowerCase()] || 'residential';
};

const mapPropertyStatus = (frontendStatus) => {
  if (!frontendStatus) return undefined;
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
  return statusMap[String(frontendStatus).toLowerCase()] || 'active';
};

const mapStatusFilterToDbStatuses = (statusFilter) => {
  if (!statusFilter) return null;
  const value = String(statusFilter).toLowerCase();

  switch (value) {
    case 'for-sale':
    case 'for-rent':
    case 'for-lease':
    case 'for-mortgage':
    case 'for-investment':
      return ['active'];
    case 'sold':
      return ['sold'];
    case 'rented':
      return ['inactive'];
    case 'active':
    case 'inactive':
    case 'pending':
      return [value];
    default:
      return null;
  }
};

const buildPropertyPayload = (propertyData = {}) => {
  const imagesArray = normalizeImagesArray(propertyData.images || []);
  const coverImageUrl = getFirstImageUrl(imagesArray, propertyData.coverImage || propertyData.featuredImage);

  return {
    title: propertyData.title,
    description: propertyData.description,
    price: propertyData.price !== undefined ? parseDecimalField(propertyData.price) : undefined,
    type: mapPropertyType(propertyData.type),
    status: mapPropertyStatus(propertyData.status),
    ownerId: propertyData.owner?.id || propertyData.ownerId,
    ownerEmail: propertyData.owner?.email || propertyData.ownerEmail,
    location: propertyData.location?.address || propertyData.location?.googleMapsUrl || undefined,
    address: propertyData.location?.address || undefined,
    city: propertyData.location?.city || undefined,
    state: propertyData.location?.state || undefined,
    bedrooms: propertyData.details && Object.prototype.hasOwnProperty.call(propertyData.details, 'bedrooms')
      ? parseIntegerField(propertyData.details?.bedrooms)
      : undefined,
    bathrooms: propertyData.details && Object.prototype.hasOwnProperty.call(propertyData.details, 'bathrooms')
      ? parseIntegerField(propertyData.details?.bathrooms)
      : undefined,
    area: propertyData.details && Object.prototype.hasOwnProperty.call(propertyData.details, 'sqft')
      ? parseDecimalField(propertyData.details?.sqft)
      : undefined,
    images: stringifyIfNeeded(imagesArray),
    videos: stringifyIfNeeded(propertyData.videos || []),
    documents: stringifyIfNeeded(propertyData.documentation || propertyData.documents || []),
    verificationStatus: propertyData.verificationStatus || undefined,
    approvalStatus: propertyData.approvalStatus || undefined,
    category: propertyData.category || propertyData.type,
    coverImage: coverImageUrl,
    featuredImage: coverImageUrl,
  };
};

const removeUndefined = (obj = {}) => {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};

const normalizePropertyForResponse = (property = {}, original = {}) => {
  const images = normalizeImagesArray(property.images || original.images || property.image || original.image || []);
  const videos = parseJsonArray(property.videos || original.videos || []);
  const documentsRaw = property.documents || property.documentation || original.documents || original.documentation || [];
  const documents = parseJsonArray(documentsRaw);
  const coverImage = getFirstImageUrl(images, property.coverImage || property.featuredImage || property.image || original.coverImage || original.featuredImage);

  return {
    ...property,
    images,
    videos,
    documents,
    documentation: documents,
    coverImage,
    featuredImage: coverImage || property.featuredImage || null,
    image: coverImage || property.image || null,
  };
};

const getMockOwnerSnapshot = (property = {}) => {
  const fallbackName = 'Mock Vendor';
  return property.owner || {
    id: property.ownerId || 'mock-vendor',
    email: property.ownerEmail || 'mock.vendor@propertyark.com',
    firstName: property.ownerFirstName || fallbackName.split(' ')[0],
    lastName: property.ownerLastName || fallbackName.split(' ')[1] || '',
    phone: property.ownerPhone || '+234-000-000-0000',
    role: property.ownerRole || 'vendor'
  };
};

const propertyMatchesSimpleFilters = (property = {}, { status, verificationStatus }) => {
  if (status && property.status !== status) return false;
  if (verificationStatus && property.verificationStatus !== verificationStatus) return false;
  return true;
};

const propertyMatchesSearch = (property = {}, searchTerm) => {
  if (!searchTerm) return true;
  const needle = String(searchTerm).toLowerCase();
  const haystack = [property.title, property.description, property.city, property.state, property.address]
    .filter(Boolean)
    .map((field) => String(field).toLowerCase());
  return haystack.some((field) => field.includes(needle));
};

const normalizeMockProperty = (property = {}) => {
  const enriched = {
    ...property,
    owner: getMockOwnerSnapshot(property),
    isMock: true,
    source: 'mock',
    createdAt: property.createdAt || new Date().toISOString(),
    updatedAt: property.updatedAt || property.createdAt || new Date().toISOString()
  };
  return normalizePropertyForResponse(enriched, enriched);
};

const applyMockOverrides = (property = {}) => {
  if (!property || !property.id) return property;
  const overrides = mockPropertyOverrides.get(property.id);
  if (!overrides) return property;
  return {
    ...property,
    ...overrides,
    verificationStatus: overrides.verificationStatus ?? property.verificationStatus,
    approvalStatus: overrides.approvalStatus ?? property.approvalStatus,
    isVerified: overrides.isVerified ?? property.isVerified,
    verificationNotes: overrides.verificationNotes ?? property.verificationNotes,
    verifiedAt: overrides.verifiedAt ?? property.verifiedAt,
    verifiedBy: overrides.verifiedBy ?? property.verifiedBy,
    updatedAt: overrides.updatedAt ?? property.updatedAt
  };
};

const findMockPropertyById = (propertyId) => {
  if (!propertyId) return null;
  const raw = Array.isArray(mockPropertiesData)
    ? mockPropertiesData.find((property) => property.id === propertyId || property.propertyId === propertyId)
    : null;
  if (!raw) return null;
  return applyMockOverrides(normalizeMockProperty(raw));
};

const filterAndNormalizeMockProperties = ({ status, verificationStatus, search, sort = 'createdAt', order = 'desc' } = {}) => {
  const mockList = Array.isArray(mockPropertiesData) ? mockPropertiesData : [];
  const filtered = mockList.filter((property) =>
    propertyMatchesSimpleFilters(property, { status, verificationStatus }) && propertyMatchesSearch(property, search)
  );

  const sanitizedSort = sanitizeSortField(sort);
  const direction = order === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    const aVal = sanitizedSort === 'createdAt'
      ? new Date(a.createdAt || a.updatedAt || 0).getTime()
      : a[sanitizedSort];
    const bVal = sanitizedSort === 'createdAt'
      ? new Date(b.createdAt || b.updatedAt || 0).getTime()
      : b[sanitizedSort];

    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1 * direction;
    if (bVal === undefined || bVal === null) return -1 * direction;
    return aVal > bVal ? 1 * direction : -1 * direction;
  });

  return filtered.map((property) => applyMockOverrides(normalizeMockProperty(property)));
};

const summarizeMockPropertyStats = (mockList = []) => {
  return mockList.reduce((acc, property) => {
    incrementStatsCounters(acc, property);
    return acc;
  }, createEmptyPropertyStats());
};

const persistCoverImageIfMissing = (modelInstance, normalized = {}) => {
  if (!modelInstance || !normalized) return;
  const dataValues = modelInstance.dataValues || {};
  if (!Object.prototype.hasOwnProperty.call(dataValues, 'coverImage')) return;

  const cover = normalized.coverImage;
  if (!cover) return;

  const needsUpdate = (!modelInstance.coverImage || modelInstance.coverImage !== cover)
    || (!modelInstance.featuredImage || modelInstance.featuredImage !== cover);
  if (!needsUpdate || typeof modelInstance.update !== 'function') return;

  modelInstance.update({ coverImage: cover, featuredImage: cover }).catch((err) => {
    console.warn('propertyService: failed to persist cover image', err?.message || err);
  });
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
  order = 'desc',
  ownerId
} = {}) => {
  const fs = require('fs');
  const path = require('path');
  const logPath = path.resolve(__dirname, '..', 'server_error.log');
  try {
  const where = {};
  const normalizedStatusFilters = mapStatusFilterToDbStatuses(status);
  const normalizedVerificationFilters = mapVerificationStatusToDbStatuses(verificationStatus);

  const applyStatusFilters = (filters) => {
    if (!filters) return;
    if (Array.isArray(filters)) {
      if (!filters.length) return;
      where.status = filters.length === 1 ? filters[0] : { [Op.in]: filters };
    } else {
      where.status = filters;
    }
  };

  if (normalizedStatusFilters && normalizedVerificationFilters) {
    const intersection = normalizedStatusFilters.filter((value) => normalizedVerificationFilters.includes(value));
    if (intersection.length) {
      applyStatusFilters(intersection);
    } else {
      where.status = { [Op.eq]: null, [Op.ne]: null };
    }
  } else {
    applyStatusFilters(normalizedStatusFilters || normalizedVerificationFilters);
  }
  if (ownerId) where.ownerId = ownerId;

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { city: { [Op.iLike]: `%${search}%` } },
      { state: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const orderArr = [[sanitizeSortField(sort), order === 'asc' ? 'ASC' : 'DESC']];
  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await PropertyModel.findAndCountAll({
    where,
    order: orderArr,
    offset,
    limit: Number(limit),
    include: [
      {
        association: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isVerified']
      }
    ]
  });

  const dbStats = await getDatabasePropertyStats();

  // Normalize approvalStatus and verificationStatus for frontend compatibility
  const normalizeApprovalFields = (property) => {
    let approvalStatus = property.approvalStatus;
    let verificationStatus = property.verificationStatus;
    // If verificationStatus is 'verified', set approvalStatus to 'approved'
    if (!approvalStatus && verificationStatus === 'verified') {
      approvalStatus = 'approved';
    }
    // If approvalStatus is 'approved', set verificationStatus to 'verified'
    if (!verificationStatus && approvalStatus === 'approved') {
      verificationStatus = 'verified';
    }
    // If both are missing but property.isVerified is true, set both
    if (!approvalStatus && !verificationStatus && property.isVerified) {
      approvalStatus = 'approved';
      verificationStatus = 'verified';
    }
    return {
      ...property,
      approvalStatus,
      verificationStatus
    };
  };

  const formatProperty = (row) => {
    const json = row.toJSON();
    const withStatus = normalizeApprovalFields(json);
    const normalized = normalizePropertyForResponse(withStatus, json);
    persistCoverImageIfMissing(row, normalized);
    return normalized;
  };

  const dbProperties = rows.map(formatProperty);
  const mockProperties = filterAndNormalizeMockProperties({ status, verificationStatus, search, sort, order });
  const mergedProperties = [...dbProperties, ...mockProperties];

  const mockStats = summarizeMockPropertyStats(mockProperties);
  const statsWithMock = mergeStats(dbStats, mockStats);

  const totalItems = count + mockProperties.length;
  const itemsPerPage = Number(limit);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return {
    properties: mergedProperties,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalItems,
      itemsPerPage
    },
    stats: statsWithMock,
    meta: {
      mockCount: mockProperties.length,
      realCount: dbProperties.length
    }
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
  const p = await PropertyModel.findByPk(propertyId, {
    include: [
      {
        association: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role']
      }
    ]
  });
  if (p) {
    const raw = p.toJSON();
    const normalized = normalizePropertyForResponse(raw, raw);
    persistCoverImageIfMissing(p, normalized);
    return normalized;
  }

  const mockProperty = findMockPropertyById(propertyId);
  return mockProperty || null;
};

const createProperty = async (propertyData) => {
  try {
    const payload = removeUndefined(buildPropertyPayload(propertyData));
    const created = await PropertyModel.create(payload);
    const raw = created.toJSON();
    const normalized = normalizePropertyForResponse(raw, raw);
    persistCoverImageIfMissing(created, normalized);
    return normalized;
  } catch (error) {
    console.error('Error in createProperty:', error);
    throw error;
  }
};

const updateProperty = async (propertyId, updates) => {
  const p = await PropertyModel.findByPk(propertyId);
  if (!p) return null;
  const payload = removeUndefined(buildPropertyPayload(updates));
  const { location, details, images, videos, documentation, documents, coverImage, featuredImage, ...rest } = updates || {};
  const extra = removeUndefined({ ...rest });
  const finalPayload = { ...extra, ...payload };
  await p.update(finalPayload);
  const updated = await PropertyModel.findByPk(propertyId);
  const raw = updated.toJSON();
  const normalized = normalizePropertyForResponse(raw, raw);
  persistCoverImageIfMissing(updated, normalized);
  return normalized;
};

const updatePropertyVerification = async (propertyId, { status, notes, adminId }) => {
  const p = await PropertyModel.findByPk(propertyId);
  if (p) {
    await p.update({ verificationStatus: status, verificationNotes: notes || '', isVerified: status === 'verified', verifiedBy: adminId, verifiedAt: new Date() });
    const latest = await PropertyModel.findByPk(propertyId);
    const raw = latest.toJSON();
    const normalized = normalizePropertyForResponse(raw, raw);
    persistCoverImageIfMissing(latest, normalized);
    return normalized;
  }

  const mock = findMockPropertyById(propertyId);
  if (!mock) return null;

  const updatedAt = new Date().toISOString();
  const approvalStatus = status === 'verified' ? 'approved' : 'rejected';
  const overridePayload = {
    verificationStatus: status,
    approvalStatus,
    isVerified: status === 'verified',
    verificationNotes: notes || '',
    verifiedBy: adminId,
    verifiedAt: updatedAt,
    updatedAt
  };
  mockPropertyOverrides.set(propertyId, overridePayload);
  return applyMockOverrides({ ...mock, ...overridePayload });
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

  const propertyJson = property ? normalizePropertyForResponse(property.toJSON(), property.toJSON()) : null;
  if (property && propertyJson) {
    persistCoverImageIfMissing(property, propertyJson);
  }
  return { property: propertyJson, favorites, isFavorited };
};

const getPropertyStats = async () => {
  return getDatabasePropertyStats();
};

const getPropertyStatusSummary = async () => getDatabasePropertyStats();

const listRecentProperties = async (limit = 5) => {
  const rows = await PropertyModel.findAll({ order: [['createdAt', 'DESC']], limit: Number(limit) });
  return rows.map(row => {
    const raw = row.toJSON();
    const normalized = normalizePropertyForResponse(raw, raw);
    persistCoverImageIfMissing(row, normalized);
    return normalized;
  });
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

