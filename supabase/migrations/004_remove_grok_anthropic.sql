-- Remove grok and anthropic from AI provider options, keep only groq and openai
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_ai_provider_check;
ALTER TABLE users ADD CONSTRAINT users_ai_provider_check 
  CHECK (ai_provider IN ('groq', 'openai'));

-- Update any existing users with grok or anthropic to groq (primary)
UPDATE users SET ai_provider = 'groq' WHERE ai_provider IN ('grok', 'anthropic');

