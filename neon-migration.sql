-- Neon Database Migration Script
-- Generated for Real Estate Marketplace

-- Drop existing tables
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    isActive BOOLEAN DEFAULT true,
    isVerified BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(15,2),
    type VARCHAR(50),
    status VARCHAR(50),
    location TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    ownerId UUID REFERENCES users(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert mock vendor user
INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Mock', 'Vendor', 'mock.vendor@propertyark.com', 'hashed_password_placeholder', 'vendor', true, true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_ownerId ON properties(ownerId);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

-- Verification queries
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as property_count FROM properties;
