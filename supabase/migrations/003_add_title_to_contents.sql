-- Add title column to contents for deterministic titles
ALTER TABLE contents
ADD COLUMN IF NOT EXISTS title TEXT;

-- Optional: index for title search
CREATE INDEX IF NOT EXISTS idx_contents_title ON contents USING gin (to_tsvector('english', coalesce(title, '')));

