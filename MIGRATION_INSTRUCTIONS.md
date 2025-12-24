# Database Migration Required

## Issue
The `content_id` column is missing from the `chat_sessions` table, causing chat isolation to fail.

## Solution
Run the following SQL migration in your Supabase SQL Editor:

```sql
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
```

## Steps
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste the SQL above
4. Click "Run"
5. Verify the migration succeeded

## Temporary Workaround
The code includes a fallback that stores `contentId` in message metadata until the migration is run. However, this is not ideal and should be replaced with the proper column.

## After Migration
Once the migration is complete, the fallback code will automatically use the `content_id` column and chat isolation will work correctly.

