-- Add password column to users table for password-based authentication
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for user authentication';
