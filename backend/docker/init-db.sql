-- Database initialization script
-- This script runs when the container is first created

-- Set proper encoding and locale
SET client_encoding = 'UTF8';
SET timezone = 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log initialization
SELECT 'Database initialized successfully' as status;
