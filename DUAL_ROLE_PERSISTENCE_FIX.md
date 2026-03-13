# Dual Role Persistence Fix - Implementation Summary

**Issue:** Users with dual roles (buyer + vendor) would revert to a single role after logout and login.

**Root Cause:** Multiple role management endpoints were either not persisting `activeRole` to the database or were replacing/overwriting the `roles` array instead of preserving it.

---

## Problems Identified & Fixed

### Problem 1: `activeRole` Not Fetched on Login (auth-jwt.js - Line 617)
**Issue:** The fallback SELECT query used when the primary query fails was missing the `activeRole` field.

```javascript
// BEFORE (incomplete)
const fallbackSql = 'SELECT id, email, password, "firstName", "lastName", phone, role, roles, avatar, "isVerified" FROM "users" WHERE email = :email LIMIT 1';

// AFTER (complete)
const fallbackSql = 'SELECT id, email, password, "firstName", "lastName", phone, role, roles, "activeRole", avatar, "isVerified" FROM "users" WHERE email = :email LIMIT 1';
```

**Impact:** When users logged in and the fallback query was triggered (due to DB errors or connection issues), the `activeRole` wasn't retrieved. This caused buildUserResponse() to default to the first role in the array instead of the user's chosen active role.

**Symptoms:** 
- User was vendor, becomes buyer, sets activeRole to 'buyer'
- After logout → login with DB connection issues → activeRole reverted to 'vendor'

---

### Problem 2: Buyer Profile Hardcoding activeRole (buyer.js - Line 60)
**Issue:** When a user updated their buyer profile, the endpoint always set `activeRole: 'buyer'`, regardless of what role they were switching from.

```javascript
// BEFORE (hardcoded)
await user.update({
  roles: updatedRoles,
  activeRole: 'buyer',  // Always 'buyer'!
  buyerData: { ... }
});

// AFTER (intelligent)
const { chooseActiveRole } = require('../utils/roleUtils');
const newActiveRole = chooseActiveRole(user.activeRole, 'buyer', updatedRoles);

await user.update({
  roles: updatedRoles,
  activeRole: newActiveRole,  // Respects existing preference
  buyerData: { ... }
});
```

**Impact:** 
- If a vendor became a buyer, their activeRole would be set to 'buyer'
- But there was no way to switch back to vendor without calling a separate switch-role endpoint
- After logout/login cycle, if the user wasn't on buyer dashboard, they might see the wrong role

**Symptoms:**
- User becomes buyer but can't switch back to vendor role efficiently
- Role preference not persisted correctly

---

### Problem 3: Vendor KYC Verification Hardcoding activeRole (vendor.js - Line 110)
**Issue:** When a vendor verified/submitted KYC documents, the endpoint hardcoded `activeRole: 'vendor'`.

```javascript
// BEFORE (hardcoded)
await user.update({ 
  role: 'vendor', 
  roles: existingRoles, 
  activeRole: 'vendor',  // Always 'vendor'!
  vendorData 
});

// AFTER (intelligent)
const activeRole = chooseActiveRole(user.activeRole, 'vendor', existingRoles);

await user.update({ 
  role: activeRole || 'vendor', 
  roles: existingRoles, 
  activeRole: activeRole || 'vendor',
  vendorData 
});
```

**Impact:** Similar to problem 2, but for vendor profile. If a buyer+vendor tried to resubmit KYC, their activeRole would be forced to 'vendor' even if they preferred 'buyer'.

---

### Problem 4: Admin KYC Approval Replacing Roles Array (admin.js - Line 447)
**Issue:** When an admin approved vendor KYC, the endpoint was replacing the entire `roles` array with just `['vendor']`, removing any other roles like 'buyer'.

```javascript
// BEFORE (destructive)
await db.sequelize.query(`UPDATE users SET "vendorData" = :vd::json, role = 'vendor', "roles" = :roles::json, "activeRole" = 'vendor' WHERE id = :id`, 
  { replacements: { vd: JSON.stringify(vd), roles: JSON.stringify(['vendor']), id: userId } }
);

// AFTER (preserving)
let existingRoles = r.roles;
try { existingRoles = Array.isArray(existingRoles) ? existingRoles : (existingRoles ? JSON.parse(existingRoles) : []); } catch (e) { existingRoles = []; }
const preservedRoles = normalizeRoles([...existingRoles, 'vendor']);
const nextActiveRole = chooseActiveRole(r.activeRole, 'vendor', preservedRoles);

await db.sequelize.query(
  `UPDATE users SET "vendorData" = :vd::json, role = :activeRole, "roles" = :roles::json, "activeRole" = :activeRole WHERE id = :id`, 
  { replacements: { vd: JSON.stringify(vd), roles: JSON.stringify(preservedRoles), activeRole: nextActiveRole, id: userId } }
);
```

**Impact:** This is the most critical issue! When an admin approved a KYC application:
- User had roles: ['user', 'buyer'] 
- Admin approved KYC
- User's roles became: ['vendor'] ← **LOST 'user' and 'buyer'!**
- User could no longer access buyer features or any non-vendor features

**Symptoms:**
- After admin KYC approval, dual-role users lost access to their other roles
- This was permanent until manually fixed by admin

---

## Solution Architecture

### 1. Role Normalization Utility
The solution uses the existing `chooseActiveRole()` utility from `../utils/roleUtils`:

```javascript
const { normalizeRoles, chooseActiveRole } = require('../utils/roleUtils');

// This function intelligently chooses which role should be active
// - If user already has activeRole set and new role is being added, keeps existing activeRole
// - Otherwise sets the new role as activeRole
// Examples:
// chooseActiveRole('buyer', 'vendor', ['user', 'buyer', 'vendor']) → 'buyer' (preserves)
// chooseActiveRole(null, 'vendor', ['user', 'vendor']) → 'vendor' (defaults to new)
```

### 2. Dual Role Arrays
All endpoints now properly handle roles as arrays:

```javascript
const currentRoles = Array.isArray(user.roles) ? user.roles : [];
const updatedRoles = normalizeRoles([...currentRoles, newRole]);  // Adds without duplicating
```

### 3. Database Fields Updated
Ensuring all relevant endpoints fetch AND persist these fields:
- `roles` (JSON array) - All roles the user has
- `activeRole` (string) - Currently active/visible role
- `role` (enum) - Legacy field for backward compatibility

---

## Files Modified

### 1. `/backend/routes/auth-jwt.js`
- **Line 617:** Added `"activeRole"` to fallback SELECT query
- **Reason:** Ensures activeRole is retrieved even when primary query fails
- **Impact:** Prevents activeRole from being missing on login

### 2. `/backend/routes/buyer.js`
- **Lines 58-64:** Changed from hardcoded activeRole to using `chooseActiveRole()`
- **Reason:** Preserve buyer's original role preference when they add buyer role
- **Impact:** Allows proper role switching and persistence

### 3. `/backend/routes/vendor.js`
- **Lines 111-115:** Changed from hardcoded activeRole to using `chooseActiveRole()`
- **Reason:** Preserve user's role preference when they submit KYC
- **Impact:** KYC submission doesn't force activeRole to 'vendor'

### 4. `/backend/routes/admin.js`
- **Lines 434-463:** Complete rewrite of vendor KYC approval logic
- **Reason:** Preserve existing roles instead of replacing with ['vendor']
- **Changes:**
  - Query existing roles from database
  - Merge new role with existing roles
  - Use chooseActiveRole for smart role switching
- **Impact:** Admin approval preserves all user roles

---

## Testing Recommendations

### Scenario 1: User Becomes Dual Role
1. Register as vendor only
2. Add buyer profile
3. Verify `/api/buyer/profile` POST response includes both roles
4. Logout and login
5. **Expected:** Both roles persist, activeRole respected

### Scenario 2: Admin Approves KYC for Dual Role User
1. Register as buyer
2. Add vendor profile
3. Admin approves vendor KYC
4. **Expected:** User still has both ['user', 'buyer', 'vendor'] roles
5. User can still access buyer dashboard

### Scenario 3: Role Persistence After DB Error
1. User logs in → system triggers fallback query
2. **Expected:** activeRole is correctly retrieved (not missing)
3. User's active role preserved

### Scenario 4: Dashboard Switching
1. User with dual roles switches from vendor to buyer dashboard
2. activeRole updates to 'buyer'
3. Logout and login
4. **Expected:** Still on buyer dashboard view (activeRole persisted)

---

## Backward Compatibility

✅ All changes are fully backward compatible:
- Single-role users (vendor only or buyer only) work as before
- `role` field still populated for legacy code
- `roles` array correctly derived from existing data
- No database schema changes required

---

## Deployment Instructions

1. **Stop backend server**
2. **Pull changes from GitHub**
   ```bash
   git pull origin main
   ```
3. **Restart backend server** (no migrations needed)
4. **Test with dual-role user:**
   - Logout all sessions
   - Log back in as buyer+vendor user
   - Verify both roles available in dashboard switch
   - After logout/login, verify roles still present

---

## Impact Summary

| Issue | Severity | Status |
|-------|----------|--------|
| activeRole not fetched on login | High | ✅ Fixed |
| Buyer profile hardcoding role | High | ✅ Fixed |
| Vendor KYC hardcoding role | High | ✅ Fixed |
| Admin KYC replacing roles | Critical | ✅ Fixed |

**Result:** Dual roles now persist permanently across logout/login cycles and role switches.

---

## Related Files
- Database: `users` table (no changes needed)
- Models: `/backend/models/sequelize/User.js` (no changes)
- Utils: `/backend/utils/roleUtils.js` (already has correct logic)
- Frontend: Uses existing switchRole() which now works correctly

---

**Commit:** d037da6
**Date:** March 2026
