-- Migrate missing real users to Neon database
-- Adding admin@propertyark.com and onyedika.akoma@gmail.com

-- First, let's clear existing users and add the real ones
DELETE FROM users;

-- Insert admin user
INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) 
VALUES ('admin-uuid-001', 'Admin', 'User', 'admin@propertyark.com', 'hashed_admin_password', 'admin', true, true, '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Insert onyedika user
INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) 
VALUES ('user-uuid-002', 'Onyedika', 'Akoma', 'onyedika.akoma@gmail.com', 'hashed_user_password', 'user', true, true, '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Keep the mock vendor for property ownership
INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Mock', 'Vendor', 'mock.vendor@propertyark.com', 'hashed_password_placeholder', 'vendor', true, true, '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Add some additional test users if needed
INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) 
VALUES 
('user-uuid-003', 'John', 'Doe', 'john.doe@example.com', 'hashed_password', 'buyer', true, false, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('user-uuid-004', 'Jane', 'Smith', 'jane.smith@example.com', 'hashed_password', 'vendor', true, true, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('user-uuid-005', 'Mike', 'Johnson', 'mike.johnson@example.com', 'hashed_password', 'agent', true, true, '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Verification queries
SELECT COUNT(*) as total_users FROM users;
SELECT email, role, isActive, isVerified FROM users ORDER BY createdAt;

-- Check property ownership
SELECT u.email, COUNT(p.id) as property_count 
FROM users u 
LEFT JOIN properties p ON u.id = p.ownerid 
GROUP BY u.id, u.email 
ORDER BY property_count DESC;
