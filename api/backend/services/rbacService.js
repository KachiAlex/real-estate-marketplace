/**
 * Phase 3.4: Comprehensive Role-Based Access Control (RBAC)
 * 
 * Implements:
 * - Role hierarchy with permission inheritance
 * - Permission-based access control (PBAC)
 * - Resource ownership verification
 * - Active role switching for multi-role users
 */

/**
 * Role hierarchy and permissions definitions
 * Hierarchy allows permission inheritance: higher roles inherit lower role permissions
 */
const ROLE_HIERARCHY = {
  'admin': {
    level: 100,
    displayName: 'Administrator',
    description: 'Full system access, user management, system configuration',
    permissions: [
      // User management
      'user:list',
      'user:view',
      'user:edit',
      'user:delete',
      'user:suspend',
      'user:restore',
      'user:verify-email',
      
      // Role management
      'role:assign',
      'role:revoke',
      
      // Property management
      'property:list',
      'property:view',
      'property:edit',
      'property:delete',
      'property:verify',
      'property:reject',
      'property:approve',
      
      // Payment and financial
      'payment:list',
      'payment:view',
      'payment:refund',
      'escrow:manage',
      'escrow:resolve-dispute',
      
      // Vendor management
      'vendor:approve',
      'vendor:reject',
      'vendor:suspend',
      'vendor:list-kyc-docs',
      
      // System
      'system:access-logs',
      'system:audit-trail',
      'system:config',
      'system:view-analytics',
      
      // API
      'api:admin',
      'api:read',
      'api:write',
      'api:delete'
    ]
  },
  
  'vendor': {
    level: 50,
    displayName: 'Vendor/Agent',
    description: 'Property listing, sales management, client communication',
    permissions: [
      // Property management (owned properties only)
      'property:view',
      'property:create',
      'property:edit:own',
      'property:view-analytics:own',
      'property:list:own',
      
      // Payment
      'payment:view:own',
      'payment:list:own',
      
      // Escrow
      'escrow:view:own',
      'escrow:file-dispute:own',
      'escrow:respond-dispute',
      
      // Client communication
      'chat:send',
      'chat:view:own',
      'notification:receive',
      
      // Profile
      'profile:edit:own',
      'profile:view:own',
      
      // API
      'api:read',
      'api:write:own'
    ]
  },
  
  'agent': {
    level: 45,
    displayName: 'Agent',
    description: 'Property sales support, client management',
    permissions: [
      'property:view',
      'property:list:own',
      'property:view:own',
      
      'chat:send',
      'chat:view:own',
      'notification:receive',
      
      'payment:view:own',
      'escrow:view:own',
      
      'profile:edit:own',
      'profile:view:own',
      
      'api:read',
      'api:write:own'
    ]
  },
  
  'user': {
    level: 10,
    displayName: 'Regular User',
    description: 'Browse properties, communicate with sellers, purchase properties',
    permissions: [
      // Property browsing
      'property:view',
      'property:list',
      'property:search',
      
      // Payment
      'payment:create',
      'payment:view:own',
      'payment:list:own',
      
      // Escrow
      'escrow:create',
      'escrow:view:own',
      'escrow:file-dispute:own',
      
      // Chat
      'chat:send',
      'chat:view:own',
      'notification:receive',
      
      // Profile
      'profile:view:own',
      'profile:edit:own',
      'password:change:own',
      
      // API
      'api:read',
      'api:write:own'
    ]
  },
  
  'guest': {
    level: 1,
    displayName: 'Guest',
    description: 'Limited access - browse public properties only',
    permissions: [
      'property:view',
      'property:list',
      'property:search',
      'api:read'
    ]
  }
};

class RBACService {
  /**
   * Get all permissions for a user (including inherited from role hierarchy)
   */
  static getAllPermissions(userRole) {
    const role = ROLE_HIERARCHY[userRole];
    if (!role) {
      return ROLE_HIERARCHY['guest'].permissions;
    }
    return role.permissions || [];
  }

  /**
   * Check if user has a specific permission
   */
  static hasPermission(userRole, permission) {
    const permissions = this.getAllPermissions(userRole);
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of multiple permissions
   */
  static hasAnyPermission(userRole, permissions) {
    return permissions.some(perm => this.hasPermission(userRole, perm));
  }

  /**
   * Check if user has all of multiple permissions
   */
  static hasAllPermissions(userRole, permissions) {
    return permissions.every(perm => this.hasPermission(userRole, perm));
  }

  /**
   * Verify resource ownership for permission checks
   * For permissions like 'property:edit:own', we need to verify the user owns the resource
   */
  static verifyOwnership(userId, ownerId) {
    return userId === ownerId;
  }

  /**
   * Parse permission format: "resource:action:scope"
   * Examples:
   * - "property:view" - view any property
   * - "property:edit:own" - edit own properties only
   * - "user:delete" - delete any user
   */
  static parsePermission(permission) {
    const parts = permission.split(':');
    return {
      resource: parts[0],
      action: parts[1],
      scope: parts[2] || 'any' // 'own' means resource owner only, 'any' means any
    };
  }

  /**
   * Check if permission can be executed on a specific resource
   */
  static canExecutePermission(userRole, permission, resourceOwnerUserId, currentUserId) {
    const parsed = this.parsePermission(permission);
    const hasBasePermission = this.hasPermission(userRole, permission);
    
    if (!hasBasePermission) {
      return false;
    }

    // If permission is scoped to 'own', verify ownership
    if (parsed.scope === 'own') {
      return this.verifyOwnership(currentUserId, resourceOwnerUserId);
    }

    // Otherwise, permission is granted
    return true;
  }

  /**
   * Get role information
   */
  static getRoleInfo(role) {
    return ROLE_HIERARCHY[role] || ROLE_HIERARCHY['guest'];
  }

  /**
   * Get all available roles
   */
  static getAllRoles() {
    return Object.keys(ROLE_HIERARCHY).map(role => ({
      id: role,
      ...ROLE_HIERARCHY[role]
    }));
  }

  /**
   * Check role hierarchy - can user A manage permissions for role B?
   * Higher level roles can manage lower level roles
   */
  static canManageRole(userRole, targetRole) {
    const userLevel = ROLE_HIERARCHY[userRole]?.level || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole]?.level || 0;
    return userLevel > targetLevel && userLevel >= 100; // Only admins can manage roles
  }
}

module.exports = RBACService;
