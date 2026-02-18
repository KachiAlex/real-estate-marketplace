const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const db = require('../config/sequelizeDb');
const { User, Property } = db;

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get user favorites
// @route   GET /api/users/favorites
// @access  Private
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // favorites stored as JSON array on the User model
    res.json({ success: true, data: user.favorites || [] });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get user properties
// @route   GET /api/users/properties
// @access  Private
router.get('/properties', protect, async (req, res) => {
  try {
    const properties = await Property.findAll({ where: { ownerId: req.user.id }, include: [{ model: User, as: 'owner', attributes: ['firstName', 'lastName', 'email', 'avatar'] }] });
    res.json({ success: true, data: properties.map(p => p.toJSON()) });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;  