
-- Test admin login
-- This script tests if the admin account can be authenticated

-- First, let's see the current admin user
SELECT * FROM users WHERE email = 'admin@propertyark.com';

-- The password hash for 'admin123' should be:
-- $2b$12$7GFmucBlan4gLu3v9UqcKu83fP422lJO/Foy5TpwA0RCk10ECQ0J6

-- To verify, you can use this in Node.js:
-- const bcrypt = require('bcrypt');
-- const isValid = await bcrypt.compare('admin123', '$2b$12$7GFmucBlan4gLu3v9UqcKu83fP422lJO/Foy5TpwA0RCk10ECQ0J6');
-- console.log('Password valid:', isValid);
    