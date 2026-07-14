-- Real users migration to Neon
-- Generated on: 2026-04-12T08:04:31.189Z

INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Mock', 'Vendor', 'mock.vendor@propertyark.com', 'hashed_password_placeholder', 'vendor', true, true, 'Sat Apr 11 2026 17:29:44 GMT+0100 (Wẹ́st Áfríká Fíksd Taim)', 'Sat Apr 11 2026 17:29:44 GMT+0100 (Wẹ́st Áfríká Fíksd Taim)');

-- Verification
SELECT COUNT(*) as total_users FROM users;
SELECT email, role FROM users ORDER BY createdAt;
