const { getFirestore } = require('../config/firestore');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

const COLLECTION = 'users';

// Helper to convert Firestore timestamps to Date
const convertTimestamps = (doc) => {
  if (!doc) return null;
  
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id || doc._id;
  
  const converted = { id, ...data };
  
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
    // Handle both Firestore Timestamp and number (timestamp)
    if (typeof converted.resetPasswordExpires === 'object' && converted.resetPasswordExpires.toDate) {
      converted.resetPasswordExpires = converted.resetPasswordExpires.toDate().getTime();
    } else if (converted.resetPasswordExpires instanceof Date) {
      converted.resetPasswordExpires = converted.resetPasswordExpires.getTime();
    }
    // If it's already a number, keep it as is
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

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
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
  convertTimestamps
};

