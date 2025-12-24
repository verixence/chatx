-- Add content_id to chat_sessions for content-scoped chats
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES contents(id) ON DELETE CASCADE;

-- Create unique constraint: one chat session per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_sessions_content_id 
ON chat_sessions(content_id) 
WHERE content_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_sessions_content_id_lookup 
ON chat_sessions(content_id);

-- Migrate existing sessions: set content_id to NULL (they become workspace-level chats)
-- This is safe as we're adding a new column with no NOT NULL constraint

