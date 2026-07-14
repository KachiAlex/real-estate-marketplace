const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const db = require('../config/sequelizeDb');
const { User, Property } = db;

const { normalizeRoles, chooseActiveRole } = require('../utils/roleUtils');

// Detect Sequelize DB column-not-exists errors (works for both find and update)
const isMissingColumnError = (err) => {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return msg.includes('column') && msg.includes('does not exist');
};

// Fallback: load user via raw SQL so the endpoint works even if DB
// has not yet been migrated with new columns (roles, activeRole).
const rawFindUserByPk = async (id) => {
  const [rows] = await User.sequelize.query(
    `SELECT id, email, password, firstname AS "firstName", lastname AS "lastName",
            role, isactive AS "isActive", isverified AS "isVerified",
            createdat AS "createdAt", updatedat AS "updatedAt"
     FROM "users" WHERE id = :id LIMIT 1`,
    { replacements: { id } }
  );
  return rows && rows[0] ? rows[0] : null;
};

// Fallback: update role fields via raw SQL when Sequelize model
// references columns not yet present in the database.
const rawUpdateUserRoles = async (id, { roles, activeRole, role }) => {
  const updates = [];
  const values = { id };
  if (role !== undefined) { updates.push(`role = :role`); values.role = role; }
  if (activeRole !== undefined) { updates.push(`activerole = :activeRole`); values.activeRole = activeRole; }
  if (roles !== undefined) { updates.push(`roles = :roles::jsonb`); values.roles = JSON.stringify(roles); }
  if (!updates.length) return;
  const sql = `UPDATE "users" SET ${updates.join(', ')} WHERE id = :id`;
  await User.sequelize.query(sql, { replacements: values });
};


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
    let result;
    try {
      result = await User.sequelize.transaction(async (t) => {
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
        let updates = { roles: updated, activeRole: newActive };
        await user.update(updates, { transaction: t });
        return { user, roles: updated, activeRole: newActive };
      });
    } catch (trxErr) {
      if (isMissingColumnError(trxErr)) {
        // Fallback: raw SQL update without transaction
        const rawUser = await rawFindUserByPk(targetId);
        if (!rawUser) throw new Error('User not found');
        const currentRoles = Array.isArray(rawUser.roles)
          ? rawUser.roles.map(r => String(r).toLowerCase())
          : [String(rawUser.role || 'user').toLowerCase()];
        let updated = currentRoles.slice();
        const r = String(role).trim().toLowerCase();
        if (action === 'add') {
          if (!updated.includes(r)) updated.push(r);
        } else {
          updated = updated.filter(x => x !== r && x !== '');
        }
        updated = normalizeRoles(updated);
        const newActive = chooseActiveRole(rawUser.activeRole, setActive ? r : null, updated);
        await rawUpdateUserRoles(targetId, { roles: updated, activeRole: newActive, role: newActive });
        result = { user: rawUser, roles: updated, activeRole: newActive };
      } else {
        throw trxErr;
      }
    }

    const responseUser = {
      ...result.user,
      roles: result.roles,
      activeRole: result.activeRole,
      role: result.activeRole
    };
    return res.json({ success: true, user: responseUser });
  } catch (error) {
    console.error('Update roles error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update roles', error: error.message });
  }
});

// @desc    Switch active role for the current user
// @route   POST /api/users/switch-role
// @access  Private
router.post('/switch-role', protect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    let user;
    try {
      user = await User.findByPk(req.user.id);
    } catch (findErr) {
      if (isMissingColumnError(findErr)) {
        user = await rawFindUserByPk(req.user.id);
      } else {
        throw findErr;
      }
    }
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get user's current roles (from Sequelize instance or raw row)
    const rawRoles = user.roles || user.dataValues?.roles;
    const rawRole = user.role || user.dataValues?.role;
    const currentRoles = Array.isArray(rawRoles)
      ? rawRoles.map(r => String(r).toLowerCase())
      : [String(rawRole || 'user').toLowerCase()];
    const normalizedRole = String(role).trim().toLowerCase();

    // Normalize roles to ensure consistency
    let updatedRoles = normalizeRoles(currentRoles);

    // If the role is not in the user's roles array, add it (support dual/multiple roles)
    if (!updatedRoles.includes(normalizedRole)) {
      updatedRoles.push(normalizedRole);
      updatedRoles = normalizeRoles(updatedRoles);
    }

    // Update the user's roles and active role
    try {
      await user.update({ roles: updatedRoles, activeRole: normalizedRole });
    } catch (updateErr) {
      if (isMissingColumnError(updateErr)) {
        await rawUpdateUserRoles(req.user.id, { roles: updatedRoles, activeRole: normalizedRole, role: normalizedRole });
      } else {
        throw updateErr;
      }
    }

    // Return normalized user response
    const responseUser = {
      ...user,
      roles: updatedRoles,
      activeRole: normalizedRole,
      role: normalizedRole
    };

    return res.json({ success: true, user: responseUser });
  } catch (error) {
    console.error('Switch role error:', error);
    return res.status(500).json({ success: false, message: 'Failed to switch role', error: error.message });
  }
});

module.exports = router;  