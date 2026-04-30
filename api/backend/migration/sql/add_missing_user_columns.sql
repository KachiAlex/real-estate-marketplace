-- Idempotent SQL to add missing columns to the users table
-- Run on the target Postgres database (psql or via migration runner)

ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "suspendedBy" VARCHAR;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "activatedBy" VARCHAR;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "verificationExpires" TIMESTAMP;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "verifiedBy" VARCHAR;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "favorites" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public."users" ADD COLUMN IF NOT EXISTS "mortgageBankProfile" VARCHAR;

-- Optional: set defaults or indices if required by your application
