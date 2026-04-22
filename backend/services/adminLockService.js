/**
 * Ensure admin@propertyark.com has admin role
 * Runs on backend startup to lock in admin privileges
 */
const ensureAdminLocked = async (db) => {
  try {
    const User = db.User;
    const admin = await User.findOne({ where: { email: 'admin@propertyark.com' } });
    
    if (!admin) {
      console.log('⚠️  [ADMIN-LOCK] admin@propertyark.com not found in database');
      return false;
    }
    
    const currentRoles = Array.isArray(admin.roles) ? admin.roles : (admin.role ? [admin.role] : []);
    const hasAdmin = currentRoles.map(r => String(r).toLowerCase()).includes('admin');
    const isAdminRole = String(admin.role).toLowerCase() === 'admin';
    const isAdminActive = String(admin.activeRole).toLowerCase() === 'admin';
    
    if (!hasAdmin || !isAdminRole || !isAdminActive) {
      console.log('🔧 [ADMIN-LOCK] Restoring admin role for admin@propertyark.com');
      console.log('   Before:', { role: admin.role, roles: admin.roles, activeRole: admin.activeRole });
      
      await admin.update({
        role: 'admin',
        roles: ['admin'],
        activeRole: 'admin',
        updatedAt: new Date()
      });
      
      const updated = await User.findOne({ where: { email: 'admin@propertyark.com' } });
      console.log('   After:', { role: updated.role, roles: updated.roles, activeRole: updated.activeRole });
      console.log('✅ [ADMIN-LOCK] Admin role locked and restored!');
      return true;
    } else {
      console.log('✅ [ADMIN-LOCK] admin@propertyark.com already has admin role locked');
      return true;
    }
  } catch (error) {
    console.error('❌ [ADMIN-LOCK] Failed to ensure admin lock:', error.message);
    return false;
  }
};

module.exports = { ensureAdminLocked };
