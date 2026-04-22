-- Create admin account with proper password hash
-- Password: admin123
-- Hash: $2b$12$7GFmucBlan4gLu3v9UqcKu83fP422lJO/Foy5TpwA0RCk10ECQ0J6

-- Insert admin user
INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) 
VALUES (
  gen_random_uuid(),
  'Admin',
  'User', 
  'admin@propertyark.com',
  '$2b$12$7GFmucBlan4gLu3v9UqcKu83fP422lJO/Foy5TpwA0RCk10ECQ0J6',
  'admin',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  isActive = EXCLUDED.isActive,
  isVerified = EXCLUDED.isVerified;

-- Verify admin user creation
SELECT id, firstName, lastName, email, role, isActive, isVerified, createdAt FROM users WHERE email = 'admin@propertyark.com';
