-- Migration: Add roles (JSON) and activeRole columns to users table
-- for dual-role support (e.g. vendor + buyer)
-- Run this against your Neon PostgreSQL database

-- Add roles JSON column with default ['user']
ALTER TABLE users
ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '["user"]';

-- Add activeRole column with default 'user'
ALTER TABLE users
ADD COLUMN IF NOT EXISTS activerole VARCHAR(50) DEFAULT 'user';

-- Backfill existing users: populate roles from single role column
UPDATE users
SET roles = to_jsonb(ARRAY[role])
WHERE roles IS NULL OR roles = 'null';

-- Backfill existing users: set activeRole from role column
UPDATE users
SET activerole = COALESCE(role, 'user')
WHERE activerole IS NULL;

-- Ensure role column stays in sync with activeRole for backward compatibility
-- (applications that read only `role` still work)
UPDATE users
SET role = COALESCE(activerole, role, 'user')
WHERE role IS NULL;
