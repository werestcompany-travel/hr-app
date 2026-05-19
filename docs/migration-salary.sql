-- Add monthly salary field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_salary numeric(12,2) DEFAULT 0;
