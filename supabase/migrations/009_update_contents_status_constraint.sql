-- Update contents table status constraint to allow 'ready' and 'partial' statuses
-- This allows content to be created with 'ready' status when title is available
-- and 'partial' status when processing is incomplete but not failed

ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_status_check;
ALTER TABLE contents ADD CONSTRAINT contents_status_check 
  CHECK (status IN ('processing', 'complete', 'error', 'ready', 'partial'));

