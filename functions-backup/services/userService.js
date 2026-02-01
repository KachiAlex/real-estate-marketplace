const { getFirestore } = require('../config/firestore');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

const COLLECTION = 'users';

// Helper to convert Firestore timestamps to Date
const convertTimestamps = (doc) => {
  if (!doc) return null;
  
  const data = doc.data ? doc.data() : doc;
  const converted = { ...data };

  // Always prefer the Firestore document ID so downstream auth uses the canonical id
  const documentId = doc.id || data.id || data._id;
  if (documentId) {
    converted.id = documentId;
  }
  
  // Convert Firestore Timestamp fields to JavaScript dates
  if (converted.createdAt && converted.createdAt.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt && converted.updatedAt.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  if (converted.lastLogin && converted.lastLogin.toDate) {
    converted.lastLogin = converted.lastLogin.toDate();
  }
  if (converted.resetPasswordExpires) {
    if (typeof converted.resetPasswordExpires === 'object' && converted.resetPasswordExpires.toDate) {
      converted.resetPasswordExpires = converted.resetPasswordExpires.toDate().getTime();
    } else if (converted.resetPasswordExpires instanceof Date) {
      converted.resetPasswordExpires = converted.resetPasswordExpires.getTime();
    }
  }
  if (converted.verificationExpires && converted.verificationExpires.toDate) {
    converted.verificationExpires = converted.verificationExpires.toDate();
  }
  if (converted.suspendedAt && converted.suspendedAt.toDate) {
    converted.suspendedAt = converted.suspendedAt.toDate();
  }
  if (converted.activatedAt && converted.activatedAt.toDate) {
    converted.activatedAt = converted.activatedAt.toDate();
  }
  if (converted.verifiedAt && converted.verifiedAt.toDate) {
    converted.verifiedAt = converted.verifiedAt.toDate();
  }
  
  return converted;
};

// Ensure a Firestore user exists for a Firebase-authenticated account
const ensureUserFromFirebase = async (claims) => {
  try {
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    if (!claims || !claims.uid) {
      throw new Error('Invalid Firebase claims');
    }

    const userId = claims.uid;
    const userRef = db.collection(COLLECTION).doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      const email = (claims.email || '').toLowerCase();
      const fullName = claims.name || email.split('@')[0] || 'User';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      const newUserDoc = {
        firstName,
        lastName,
        email,
        role: 'user',
        roles: ['user'],
        avatar: claims.picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isVerified: true,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      };

      await userRef.set(newUserDoc, { merge: true });
      return {
        id: userId,
        ...newUserDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
    }

    return convertTimestamps(userSnap);
  } catch (error) {
    console.error('Error ensuring Firebase user:', error);
    throw error;
  }
};

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
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  let filterQuery = db.collection(COLLECTION);

  if (role) {
    filterQuery = filterQuery.where('role', '==', role);
  }

  const verifiedFilter = toBooleanFilter(isVerified);
  if (verifiedFilter !== undefined) {
    filterQuery = filterQuery.where('isVerified', '==', verifiedFilter);
  }

  const sortField = sanitizeUserSortField(sort);
  const direction = order === 'asc' ? 'asc' : 'desc';
  let query = filterQuery.orderBy(sortField, direction);

  const skip = (Number(page) - 1) * Number(limit);
  const snapshot = await query.offset(skip).limit(Number(limit)).get();

  let users = snapshot.docs.map(convertTimestamps);

  if (search) {
    const lowerSearch = search.toLowerCase();
    users = users.filter((user) => (
      user.firstName?.toLowerCase().includes(lowerSearch) ||
      user.lastName?.toLowerCase().includes(lowerSearch) ||
      user.email?.toLowerCase().includes(lowerSearch)
    ));
  }

  const totalSnap = await filterQuery.count().get();
  const totalItems = totalSnap.data().count;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  return {
    users,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalItems,
      itemsPerPage: Number(limit)
    }
  };
};

const getUserStats = async () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const usersRef = db.collection(COLLECTION);
  const [totalSnap, agentSnap, verifiedSnap, activeSnap] = await Promise.all([
    usersRef.count().get(),
    usersRef.where('role', '==', 'agent').count().get(),
    usersRef.where('isVerified', '==', true).count().get(),
    usersRef.where('isActive', '==', true).count().get()
  ]);

  return {
    total: totalSnap.data().count,
    agents: agentSnap.data().count,
    verified: verifiedSnap.data().count,
    active: activeSnap.data().count
  };
};

const deleteUser = async (userId) => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  await db.collection(COLLECTION).doc(userId).delete();
};

// Find user by email
const findByEmail = async (email) => {
  try {
    if (!email || typeof email !== 'string') {
      return null;
    }
    
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const usersRef = db.collection(COLLECTION);
    const snapshot = await usersRef.where('email', '==', email.toLowerCase().trim()).limit(1).get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return convertTimestamps(doc);
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Find user by ID
const findById = async (userId) => {
  try {
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const userDoc = await db.collection(COLLECTION).doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    return convertTimestamps(userDoc);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

// Create user
const createUser = async (userData) => {
  try {
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Check if user already exists
    const existing = await findByEmail(userData.email);
    if (existing) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password if provided
    const hashedPassword = userData.password ? await hashPassword(userData.password) : null;
    
    const userDoc = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      phone: userData.phone || null,
      avatar: userData.avatar || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      role: userData.role || 'user',
      isVerified: userData.isVerified || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      preferences: userData.preferences || {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        searchPreferences: {
          minPrice: 0,
          maxPrice: 1000000,
          propertyTypes: [],
          locations: []
        }
      },
      favorites: userData.favorites || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add optional fields
    if (userData.verificationToken) userDoc.verificationToken = userData.verificationToken;
    if (userData.verificationExpires) userDoc.verificationExpires = userData.verificationExpires;
    if (userData.resetPasswordToken) userDoc.resetPasswordToken = userData.resetPasswordToken;
    if (userData.resetPasswordExpires) userDoc.resetPasswordExpires = userData.resetPasswordExpires;
    
    const userRef = db.collection(COLLECTION).doc();
    await userRef.set(userDoc);
    
    const createdUser = await userRef.get();
    const user = convertTimestamps(createdUser);
    
    // Remove password from returned user
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
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const userRef = db.collection(COLLECTION).doc(userId);
    
    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }
    
    // Convert dates to Firestore Timestamps if needed
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await userRef.update(updateData);
    
    const updatedUser = await userRef.get();
    const user = convertTimestamps(updatedUser);
    
    // Remove password from returned user
    delete user.password;
    
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Find user by reset token
const findByResetToken = async (tokenHash) => {
  try {
    const db = getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const usersRef = db.collection(COLLECTION);
    const snapshot = await usersRef
      .where('resetPasswordToken', '==', tokenHash)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const user = convertTimestamps(doc);
    
    // Check if token is expired (client-side check since Firestore doesn't support Date comparisons well)
    if (!user.resetPasswordExpires || user.resetPasswordExpires <= Date.now()) {
      return null;
    }
    
    return user;
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
  ensureUserFromFirebase,
  listUsers,
  getUserStats,
  deleteUser
};

