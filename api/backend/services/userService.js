const bcrypt = require('bcryptjs');
const db = require('../config/sequelizeDb');
const { normalizeRoles, chooseActiveRole } = require('../utils/roleUtils');
const UserModel = db.User;
const mockUsersData = require('../data/mockUsers');

const COLLECTION = 'users';

const RAW_USER_COLUMNS_FULL = `
  id,
  email,
  password,
  firstname AS "firstName",
  lastname AS "lastName",
  role,
  roles,
  activerole AS "activeRole",
  isactive AS "isActive",
  isverified AS "isVerified",
  createdat AS "createdAt",
  updatedat AS "updatedAt"
`;

const RAW_USER_COLUMNS_PUBLIC = `
  id,
  email,
  firstname AS "firstName",
  lastname AS "lastName",
  role,
  roles,
  activerole AS "activeRole",
  isactive AS "isActive",
  isverified AS "isVerified",
  createdat AS "createdAt",
  updatedat AS "updatedAt"
`;

const SORT_FIELD_TO_COLUMN = {
  createdAt: 'createdat',
  firstName: 'firstname',
  lastName: 'lastname',
  email: 'email'
};

const FIELD_TO_DB_COLUMN = {
  email: 'email',
  firstName: 'firstname',
  lastName: 'lastname',
  role: 'role',
  isActive: 'isactive',
  isVerified: 'isverified',
  password: 'password'
};

// Convert Sequelize instance to plain object and normalize date fields
const convertTimestamps = (userInstance) => {
  if (!userInstance) return null;
  const u = userInstance.toJSON ? userInstance.toJSON() : userInstance;
  return u;
};

// Ensure a Firestore user exists for a Firebase-authenticated account
// ensureUserFromFirebase removed — Firebase support has been removed.

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

const parseRolesArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (err) {
      // not JSON, fall through
    }
    return value ? [value] : [];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).filter(Boolean);
  }
  return [];
};

const normalizeRawUserRecord = (record) => {
  if (!record) return null;

  const roles = parseRolesArray(record.roles);
  const normalizedRoles = roles.length ? [...roles] : (record.role ? [record.role] : []);
  if (!normalizedRoles.length) normalizedRoles.push('user');
  if (!normalizedRoles.includes('user')) normalizedRoles.push('user');
  const uniqueRoles = Array.from(new Set(normalizedRoles.filter(Boolean)));
  const primaryRole = record.role || uniqueRoles[0] || record.userType || record.usertype || 'user';
  const derivedActiveRole = record.activeRole || record.activerole || record.active_role || primaryRole;

  const normalized = {
    ...record,
    firstName: record.firstName || record.firstname || record.first_name || record['FirstName'] || null,
    lastName: record.lastName || record.lastname || record.last_name || record['LastName'] || null,
    phone: record.phone || record.phonenumber || record.phone_number || null,
    role: primaryRole || 'user',
    roles: uniqueRoles,
    activeRole: derivedActiveRole || 'user',
    isVerified: record.isVerified ?? record.isverified ?? false,
    isActive: record.isActive ?? record.isactive ?? true,
    avatar: record.avatar || record.profileImage || null
  };

  return normalized;
};

const sanitizeUserSortField = (field) => {
  const allowed = ['createdAt', 'firstName', 'lastName', 'email', 'lastLogin'];
  return allowed.includes(field) ? field : 'createdAt';
};

const toBooleanFilter = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return undefined;
};

const matchesRoleFilter = (user, role) => {
  if (!role) return true;
  return user.role === role || (Array.isArray(user.roles) && user.roles.includes(role));
};

const matchesVerificationFilter = (user, isVerified) => {
  if (isVerified === undefined) return true;
  const boolValue = toBooleanFilter(isVerified);
  if (boolValue === undefined) return true;
  return Boolean(user.isVerified) === boolValue;
};

const matchesSearchFilter = (user, search) => {
  if (!search) return true;
  const needle = String(search).toLowerCase();
  return [user.firstName, user.lastName, user.email]
    .filter(Boolean)
    .map((field) => String(field).toLowerCase())
    .some((field) => field.includes(needle));
};

const normalizeMockUser = (user) => {
  if (!user) return null;
  const timestamp = user.createdAt || new Date().toISOString();
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || 'Mock',
    lastName: user.lastName || 'User',
    phone: user.phone || '+234-000-000-0000',
    role: user.role || user.roles?.[0] || 'user',
    roles: user.roles || [user.role || 'user'],
    activeRole: user.activeRole || user.role || user.roles?.[0] || 'user',
    isVerified: user.isVerified !== undefined ? user.isVerified : true,
    isActive: user.isActive !== undefined ? user.isActive : true,
    provider: user.provider || 'mock',
    onboardingComplete: user.onboardingComplete || user.vendorData?.onboardingComplete || false,
    vendorData: user.vendorData || null,
    createdAt: timestamp,
    updatedAt: user.updatedAt || timestamp,
    isMock: true,
    source: 'mock'
  };
};

const filterMockUsers = ({ role, isVerified, search } = {}) => {
  const mockList = Array.isArray(mockUsersData) ? mockUsersData : [];
  return mockList
    .map(normalizeMockUser)
    .filter(Boolean)
    .filter((user) => matchesRoleFilter(user, role))
    .filter((user) => matchesVerificationFilter(user, isVerified))
    .filter((user) => matchesSearchFilter(user, search));
};

const isMissingUsersTableError = (error) => {
  if (!error) return false;
  const sources = [error.message, error.parent?.message, error.original?.message, error.toString?.()]
    .filter(Boolean)
    .map((msg) => String(msg).toLowerCase());
  return sources.some((msg) => msg.includes('relation') && msg.includes('"users"') && msg.includes('does not exist'));
};

const isMissingUsersColumnError = (error) => {
  if (!error) return false;
  const sources = [error.message, error.parent?.message, error.original?.message, error.toString?.()]
    .filter(Boolean)
    .map((msg) => String(msg).toLowerCase());
  return sources.some((msg) => msg.includes('column') && msg.includes('does not exist'));
};

const listUsers = async ({
  role,
  isVerified,
  page = 1,
  limit = 20,
  search,
  sort = 'createdAt',
  order = 'desc'
} = {}) => {
  const where = {};
  if (role) where.role = role;
  if (isVerified !== undefined) where.isVerified = toBooleanFilter(isVerified);

  if (search) {
    const s = `%${search}%`;
    // Use simple email/firstName/lastName LIKE search
    const { Op } = require('sequelize');
    where[Op.or] = [
      { firstName: { [Op.iLike]: s } },
      { lastName: { [Op.iLike]: s } },
      { email: { [Op.iLike]: s } }
    ];
  }

  const sanitizedSort = sanitizeUserSortField(sort);
  const orderArr = [[sanitizedSort, order === 'asc' ? 'ASC' : 'DESC']];
  const offset = (Number(page) - 1) * Number(limit);

  const buildResult = (rows, count) => ({
    users: rows.map(convertTimestamps),
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(count / Number(limit)) || 1,
      totalItems: count,
      itemsPerPage: Number(limit)
    }
  });

  let dbResult;

  try {
    const { rows, count } = await UserModel.findAndCountAll({
      where,
      order: orderArr,
      offset,
      limit: Number(limit),
      attributes: { exclude: ['password'] }
    });
    dbResult = buildResult(rows, count);
  } catch (dbErr) {
    if (isMissingUsersColumnError(dbErr)) {
      console.warn('listUsers: detected missing users columns, continuing with mock data only');
      dbResult = buildResult([], 0);
    } else {
      // Handle missing columns - fallback to raw query
      console.warn('listUsers: UserModel.findAndCountAll failed, using raw query fallback:', dbErr.message);
      try {
        // Build WHERE clause
        const whereConditions = [];
        const replacements = {};

        if (role) {
          whereConditions.push(`role = :role`);
          replacements.role = role;
        }
        if (isVerified !== undefined) {
          whereConditions.push(`isverified = :isVerified`);
          replacements.isVerified = isVerified;
        }
        if (search) {
          whereConditions.push(`(firstname ILIKE :search OR lastname ILIKE :search OR email ILIKE :search)`);
          replacements.search = `%${search}%`;
        }

        const whereClause = whereConditions.length ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get count
        const [[{ count: countResult }]] = await UserModel.sequelize.query(
          `SELECT COUNT(*) FROM "users" ${whereClause}`,
          { replacements }
        );
        const count = Number(countResult || 0);

        // Get data
        const [rows] = await UserModel.sequelize.query(
          `SELECT ${RAW_USER_COLUMNS_PUBLIC}
           FROM "users"
           ${whereClause}
           ORDER BY ${SORT_FIELD_TO_COLUMN[sanitizedSort] || 'createdat'} ${order === 'asc' ? 'ASC' : 'DESC'}
           LIMIT :limit OFFSET :offset`,
          { replacements: { ...replacements, limit: Number(limit), offset } }
        );

        dbResult = buildResult(rows, count);
      } catch (rawErr) {
        console.error('listUsers: Raw query fallback also failed:', rawErr.message);
        if (
          isMissingUsersTableError(rawErr) ||
          isMissingUsersTableError(dbErr) ||
          isMissingUsersColumnError(rawErr) ||
          isMissingUsersColumnError(dbErr)
        ) {
          console.warn('listUsers: users schema missing, continuing with mock data only');
          dbResult = buildResult([], 0);
        } else {
          throw dbErr;
        }
      }

      if (!dbResult && (isMissingUsersTableError(dbErr) || isMissingUsersColumnError(dbErr))) {
        console.warn('listUsers: users schema missing, continuing with mock data only');
        dbResult = buildResult([], 0);
      }
    }
  }

  const mockUsers = filterMockUsers({ role, isVerified, search });

  const combinedUsers = [...(dbResult?.users || []), ...mockUsers];
  combinedUsers.sort((a, b) => {
    const aVal = a[sanitizedSort];
    const bVal = b[sanitizedSort];
    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return order === 'asc' ? -1 : 1;
    if (bVal === undefined || bVal === null) return order === 'asc' ? 1 : -1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    return 0;
  });

  const totalItems = (dbResult?.pagination?.totalItems || 0) + mockUsers.length;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  return {
    users: combinedUsers,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalItems,
      itemsPerPage: Number(limit)
    },
    meta: {
      mockCount: mockUsers.length,
      realCount: dbResult?.users?.length || 0
    }
  };
};

const getUserStats = async () => {
  const total = await UserModel.count();
  const agents = await UserModel.count({ where: { role: 'agent' } });
  const verified = await UserModel.count({ where: { isVerified: true } });
  const active = await UserModel.count({ where: { isActive: true } });

  return { total, agents, verified, active };
};

const deleteUser = async (userId) => {
  await UserModel.destroy({ where: { id: userId } });
};

// Find user by email
const findByEmail = async (email) => {
  try {
    if (!email || typeof email !== 'string') return null;
    
    try {
      const user = await UserModel.findOne({ where: { email: email.toLowerCase().trim() } });
      return user ? convertTimestamps(user) : null;
    } catch (dbErr) {
      // Handle missing columns in the database (schema mismatch)
      // Fallback to a raw query that selects available columns only
      console.warn('findByEmail: User.findOne failed, attempting raw query fallback:', dbErr.message);
      try {
        const [rows] = await UserModel.sequelize.query(
          `SELECT ${RAW_USER_COLUMNS_WITH_PASSWORD}
           FROM "users" WHERE email = :email LIMIT 1`,
          { replacements: { email: email.toLowerCase().trim() } }
        );

        if (rows && rows[0]) {
          return normalizeRawUserRecord(rows[0]);
        }
        return null;
      } catch (rawErr) {
        console.error('findByEmail: Raw query fallback also failed:', rawErr.message);
        throw dbErr; // throw the original error
      }
    }
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Find user by ID
const findById = async (userId) => {
  try {
    try {
      const user = await UserModel.findByPk(userId);
      if (!user) return null;
      return convertTimestamps(user);
    } catch (dbErr) {
      // Handle missing columns in the database (schema mismatch)
      console.warn('findById: User.findByPk failed, attempting raw query fallback:', dbErr.message);
      try {
        const [rows] = await UserModel.sequelize.query(
          `SELECT ${RAW_USER_COLUMNS_WITH_PASSWORD}
           FROM "users" WHERE id = :userId LIMIT 1`,
          { replacements: { userId } }
        );

        if (rows && rows[0]) {
          return normalizeRawUserRecord(rows[0]);
        }
        return null;
      } catch (rawErr) {
        console.error('findById: Raw query fallback also failed:', rawErr.message);
        throw dbErr; // throw the original error
      }
    }
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

// Create user
const createUser = async (userData) => {
  try {
    const existing = await findByEmail(userData.email);
    if (existing) throw new Error('User already exists with this email');

    const hashedPassword = userData.password ? await hashPassword(userData.password) : null;

    const resolvedRoles = normalizeRoles(userData.roles || userData.role || ['user']);
    const resolvedActiveRole = chooseActiveRole(userData.activeRole, userData.role || null, resolvedRoles);

    const payload = {
      email: (userData.email || '').toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      avatar: userData.avatar || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      role: resolvedActiveRole || userData.role || 'user',
      roles: resolvedRoles,
      activeRole: resolvedActiveRole || userData.role || 'user',
      isVerified: userData.isVerified || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      preferences: userData.preferences || {},
      favorites: userData.favorites || [],
      lastLogin: userData.lastLogin || null,
      verificationToken: userData.verificationToken || null,
      verificationExpires: userData.verificationExpires || null,
      resetPasswordToken: userData.resetPasswordToken || null,
      resetPasswordExpires: userData.resetPasswordExpires || null
    };

    const created = await UserModel.create(payload);
    const user = convertTimestamps(created);
    delete user.password;
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user
const updateUser = async (userId, updates) => {
  try {
    if (updates.password) updates.password = await hashPassword(updates.password);

    try {
      const user = await UserModel.findByPk(userId);
      if (!user) return null;
      await user.update(updates);
      const updated = await UserModel.findByPk(userId);
      const result = convertTimestamps(updated);
      delete result.password;
      return result;
    } catch (dbErr) {
      // Handle missing columns - use raw query fallback
      console.warn('updateUser: UserModel.findByPk failed, using raw update:', dbErr.message);

      const setClause = [];
      const replacements = { userId };

      Object.keys(updates).forEach((key, idx) => {
        const column = FIELD_TO_DB_COLUMN[key];
        if (column) {
          const paramName = `val_${idx}`;
          setClause.push(`${column} = :${paramName}`);
          replacements[paramName] = updates[key];
        }
      });

      if (setClause.length === 0) return null;

      await UserModel.sequelize.query(
        `UPDATE "users" SET ${setClause.join(', ')} WHERE id = :userId`,
        { replacements }
      );

      // Fetch updated user
      const [rows] = await UserModel.sequelize.query(
        `SELECT ${RAW_USER_COLUMNS_WITH_PASSWORD}
         FROM "users" WHERE id = :userId LIMIT 1`,
        { replacements: { userId } }
      );

      const result = rows && rows[0] ? normalizeRawUserRecord(rows[0]) : null;
      if (result) delete result.password;
      return result;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Find user by reset token
const findByResetToken = async (tokenHash) => {
  try {
    try {
      const user = await UserModel.findOne({ where: { resetPasswordToken: tokenHash } });
      if (!user) return null;
      const u = convertTimestamps(user);
      if (!u.resetPasswordExpires || new Date(u.resetPasswordExpires).getTime() <= Date.now()) return null;
      return u;
    } catch (dbErr) {
      // Fallback to raw query
      console.warn('findByResetToken: UserModel.findOne failed, using raw query:', dbErr.message);
      const [rows] = await UserModel.sequelize.query(
        `SELECT ${RAW_USER_COLUMNS_WITH_PASSWORD}
         FROM "users" WHERE resetpasswordtoken = :tokenHash LIMIT 1`,
        { replacements: { tokenHash } }
      );

      if (!rows || !rows[0]) return null;
      const u = normalizeRawUserRecord(rows[0]);
      if (!u.resetPasswordExpires || new Date(u.resetPasswordExpires).getTime() <= Date.now()) return null;
      return u;
    }
  } catch (error) {
    console.error('Error finding user by reset token:', error);
    throw error;
  }
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateUser,
  findByResetToken,
  hashPassword,
  comparePassword,
  convertTimestamps,
  listUsers,
  getUserStats,
  deleteUser
};

