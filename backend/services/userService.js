const bcrypt = require('bcryptjs');
const db = require('../config/sequelizeDb');
const UserModel = db.User;

const COLLECTION = 'users';

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

  const orderArr = [[sort, order === 'asc' ? 'ASC' : 'DESC']];
  const offset = (Number(page) - 1) * Number(limit);

  const { rows, count } = await UserModel.findAndCountAll({ where, order: orderArr, offset, limit: Number(limit) });

  return {
    users: rows.map(convertTimestamps),
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(count / Number(limit)) || 1,
      totalItems: count,
      itemsPerPage: Number(limit)
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
    const user = await UserModel.findOne({ where: { email: email.toLowerCase().trim() } });
    return user ? convertTimestamps(user) : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Find user by ID
const findById = async (userId) => {
  try {
    const user = await UserModel.findByPk(userId);
    if (!user) return null;
    return convertTimestamps(user);
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

    const payload = {
      email: (userData.email || '').toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      avatar: userData.avatar || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      role: userData.role || 'user',
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
    const user = await UserModel.findByPk(userId);
    if (!user) return null;

    if (updates.password) updates.password = await hashPassword(updates.password);

    await user.update(updates);
    const updated = await UserModel.findByPk(userId);
    const result = convertTimestamps(updated);
    delete result.password;
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Find user by reset token
const findByResetToken = async (tokenHash) => {
  try {
    const user = await UserModel.findOne({ where: { resetPasswordToken: tokenHash } });
    if (!user) return null;
    const u = convertTimestamps(user);
    if (!u.resetPasswordExpires || new Date(u.resetPasswordExpires).getTime() <= Date.now()) return null;
    return u;
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

