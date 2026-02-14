const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

/**
 * JWT Token Management for PostgreSQL Authentication
 * Replaces Firebase Auth tokens
 */

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate JWT access token
 * @param {Object} user - User object with id, email, role
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles || [user.role],

    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User object with id
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} {accessToken, refreshToken}
 */
const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_EXPIRY
  };
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @param {Object} db - Database connection
 * @returns {Object|null} {accessToken, refreshToken} or null if invalid
 */
const refreshAccessToken = async (refreshToken, db) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) return null;

    const user = await db.User.findByPk(decoded.id);
    if (!user) return null;

    return generateTokens(user);
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return null;
  }
};

/**
 * Verify and decode JWT token for middleware
 * @param {string} token - JWT token from Authorization header
 * @returns {Object|null} Decoded user data or null
 */
const verifyToken = (token) => {
  if (!token) return null;

  // Remove Bearer prefix if present
  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

  return verifyAccessToken(tokenWithoutBearer);
};

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRY,
  JWT_REFRESH_EXPIRY,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  verifyToken
};
