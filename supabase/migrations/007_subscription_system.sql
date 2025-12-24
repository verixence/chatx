-- Subscription System Migration
-- Updates subscription types and adds subscription management

-- Update subscription constraint to support new tiers
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_check 
  CHECK (subscription IN ('freemium', 'pro', 'enterprise'));

-- Update default subscription to 'freemium'
ALTER TABLE users ALTER COLUMN subscription SET DEFAULT 'freemium';

-- Update existing 'free' users to 'freemium'
UPDATE users SET subscription = 'freemium' WHERE subscription = 'free';

-- Add subscription management fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS content_count INTEGER DEFAULT 0;

-- Create subscription_history table for tracking changes
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('freemium', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_started_at ON subscription_history(started_at);

-- Function to get user's content count
CREATE OR REPLACE FUNCTION get_user_content_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM contents c
    INNER JOIN workspaces w ON c.workspace_id = w.id
    WHERE w.user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can add content (respects freemium limit of 5)
CREATE OR REPLACE FUNCTION can_user_add_content(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription TEXT;
  user_content_count INTEGER;
  max_content_limit INTEGER;
BEGIN
  -- Get user subscription
  SELECT subscription INTO user_subscription FROM users WHERE id = user_uuid;
  
  -- Get current content count
  SELECT get_user_content_count(user_uuid) INTO user_content_count;
  
  -- Set limits based on subscription
  CASE user_subscription
    WHEN 'freemium' THEN max_content_limit := 5;
    WHEN 'pro' THEN max_content_limit := 999999; -- Effectively unlimited
    WHEN 'enterprise' THEN max_content_limit := 999999; -- Effectively unlimited
    ELSE max_content_limit := 5; -- Default to freemium limit
  END CASE;
  
  RETURN user_content_count < max_content_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN users.subscription IS 'Subscription tier: freemium (5 content limit), pro (unlimited, $9.99/mo), enterprise (unlimited, $49/user/year)';
COMMENT ON COLUMN users.content_count IS 'Cached count of user content (updated via trigger)';
COMMENT ON COLUMN users.subscription_status IS 'Status of subscription: active, cancelled, expired, or trial';

