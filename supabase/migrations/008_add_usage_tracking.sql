-- Usage Tracking Migration
-- Adds daily AI request tracking for subscription limits

-- Create usage_tracking table for daily request limits
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ai_requests_count INTEGER DEFAULT 0,
  quiz_generations_count INTEGER DEFAULT 0,
  flashcard_generations_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date);

-- Function to get or create usage tracking for today
CREATE OR REPLACE FUNCTION get_or_create_usage_tracking(user_uuid UUID, tracking_date DATE DEFAULT CURRENT_DATE)
RETURNS usage_tracking AS $$
DECLARE
  usage_record usage_tracking;
BEGIN
  -- Try to get existing record
  SELECT * INTO usage_record
  FROM usage_tracking
  WHERE user_id = user_uuid AND date = tracking_date;

  -- If not found, create new record
  IF usage_record IS NULL THEN
    INSERT INTO usage_tracking (user_id, date, ai_requests_count, quiz_generations_count, flashcard_generations_count)
    VALUES (user_uuid, tracking_date, 0, 0, 0)
    RETURNING * INTO usage_record;
  END IF;

  RETURN usage_record;
END;
$$ LANGUAGE plpgsql;

-- Function to increment AI request count
CREATE OR REPLACE FUNCTION increment_ai_request_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get or create usage record for today
  PERFORM get_or_create_usage_tracking(user_uuid);

  -- Increment count
  UPDATE usage_tracking
  SET ai_requests_count = ai_requests_count + 1,
      updated_at = NOW()
  WHERE user_id = user_uuid AND date = CURRENT_DATE
  RETURNING ai_requests_count INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's AI request count
CREATE OR REPLACE FUNCTION get_today_ai_request_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COALESCE(ai_requests_count, 0) INTO request_count
  FROM usage_tracking
  WHERE user_id = user_uuid AND date = CURRENT_DATE;

  RETURN COALESCE(request_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE usage_tracking IS 'Tracks daily usage for subscription limits (AI requests, quiz generations, flashcard generations)';
COMMENT ON FUNCTION get_today_ai_request_count(UUID) IS 'Returns the number of AI requests made by user today';

