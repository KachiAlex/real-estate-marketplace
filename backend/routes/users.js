const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const db = require('../config/sequelizeDb');
const { User, Property } = db;

const { normalizeRoles, chooseActiveRole } = require('../utils/roleUtils');


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

// @desc    Add or remove a role for a user (atomic)
// @route   POST /api/users/:id/roles
// @access  Private (user themselves or admin)
router.post('/:id/roles', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    const actorId = req.user?.id;
    const { action, role, setActive } = req.body;
    if (!action || !['add', 'remove'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action' });
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    // Only allow user to modify their roles or admins
    const actor = await User.findByPk(actorId);
    const isAdmin = actor && Array.isArray(actor.roles) && actor.roles.includes('admin');
    if (actorId !== targetId && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Transactional update
    const result = await User.sequelize.transaction(async (t) => {
      const user = await User.findByPk(targetId, { transaction: t });
      if (!user) throw new Error('User not found');
      const currentRoles = Array.isArray(user.roles) ? user.roles.map(r => String(r).toLowerCase()) : [String(user.role || 'user').toLowerCase()];
      let updated = currentRoles.slice();
      const r = String(role).trim().toLowerCase();
      if (action === 'add') {
        if (!updated.includes(r)) updated.push(r);
      } else {
        updated = updated.filter(x => x !== r && x !== '');
      }
      // normalize + ensure 'user' present
      updated = normalizeRoles(updated);
      const newActive = chooseActiveRole(user.activeRole, setActive ? r : null, updated);
      // If adding vendor role, initialize or update vendorData to reflect pending KYC
      let updates = { roles: updated, activeRole: newActive };
      if (action === 'add' && r === 'vendor') {
        try {
          let vendorData = user.vendorData || {};
          try { vendorData = typeof vendorData === 'string' ? JSON.parse(vendorData) : vendorData; } catch (e) { vendorData = vendorData || {}; }
          vendorData.kycStatus = 'pending';
          vendorData.updatedAt = new Date();
          updates.vendorData = vendorData;
        } catch (vdErr) {
          console.warn('Failed to set vendorData on role add:', vdErr && vdErr.message ? vdErr.message : vdErr);
        }
      }

      await user.update(updates, { transaction: t });
      return user;
    });

    return res.json({ success: true, user: result.toJSON() });
  } catch (error) {
    console.error('Update roles error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update roles', error: error.message });
  }
});

module.exports = router;  