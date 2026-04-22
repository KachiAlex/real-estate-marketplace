-- ============================================
-- Fix Roles for Existing Users
-- ============================================
-- Run this SQL script in your PostgreSQL database console
-- to populate the roles and activerole columns for existing users

-- Step 1: Check current state
SELECT 
  id, 
  email, 
  role, 
  roles, 
  activerole,
  CASE 
    WHEN roles IS NULL THEN '❌ NULL (needs fix)'
    ELSE '✅ Has roles'
  END as status
FROM users
ORDER BY email;

-- Step 2: Update users with NULL roles
UPDATE users 
SET 
  roles = ARRAY[role], 
  activerole = role 
WHERE roles IS NULL OR activerole IS NULL;

-- Step 3: Verify the update
SELECT 
  id, 
  email, 
  role, 
  roles, 
  activerole,
  '✅ Fixed' as status
FROM users
WHERE email IN ('onyedika.akoma@gmail.com', 'admin@propertyark.com')
ORDER BY email;

-- Step 4: Check all users
SELECT 
  COUNT(*) as total_users,
  COUNT(roles) as users_with_roles,
  COUNT(*) - COUNT(roles) as users_without_roles
FROM users;

-- Expected output after fix:
-- total_users | users_with_roles | users_without_roles
-- -----------+------------------+--------------------
--          2 |                2 |                  0

-- ============================================
-- Verification Queries
-- ============================================

-- Show all users with their roles
SELECT 
  email,
  role as old_role,
  roles as new_roles_array,
  activerole as current_active_role
FROM users
ORDER BY email;

-- Check for any remaining NULL values
SELECT 
  email,
  'Missing roles' as issue
FROM users
WHERE roles IS NULL OR activerole IS NULL;

-- Should return no rows if fix was successful
