-- Initialize database for ImmoNow project
-- This script will be executed when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'Europe/Berlin';

-- Create additional database user if needed (optional)
-- The main user is already created by environment variables

-- You can add any additional initialization here
-- For example, create additional databases, users, or run specific SQL

COMMENT ON DATABASE immonow_db IS 'ImmoNow Real Estate System Database';