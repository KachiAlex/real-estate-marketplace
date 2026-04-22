
-- Neon Database Import Script
-- Run this after exporting data from your backend

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS properties (
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

-- Insert your exported data here
-- Example:
-- INSERT INTO properties (id, title, description, price, type, status, location, city, state, ownerId)
-- VALUES ('uuid-here', 'Property Title', 'Description', 100000.00, 'residential', 'active', 'Address', 'City', 'State', 'user-uuid');

-- You can import JSON data using a script or manually
