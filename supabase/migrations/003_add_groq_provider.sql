-- Add 'groq' as a valid AI provider option
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_ai_provider_check;
ALTER TABLE users ADD CONSTRAINT users_ai_provider_check 
  CHECK (ai_provider IN ('openai', 'grok', 'anthropic', 'groq'));

