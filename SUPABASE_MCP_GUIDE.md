# Using Supabase MCP for Database Operations

This guide explains how to use Supabase MCP (Model Context Protocol) for database migrations and operations in LearnChat.

## What is Supabase MCP?

Supabase MCP is a tool that allows you to interact with your Supabase database directly through Cursor or other MCP-compatible tools. It enables you to:
- Run SQL migrations
- Query data
- Manage schema changes
- Execute database operations

## Setting Up Supabase MCP

### Step 1: Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Step 3: Link Your Project

```bash
cd /Users/prapul/Documents/GitHub/LearnChat
supabase link --project-ref [YOUR-PROJECT-REF]
```

You can find your project ref in the Supabase dashboard URL: `https://app.supabase.com/project/[PROJECT-REF]`

## Running Migrations with Supabase MCP

### Method 1: Using Supabase CLI

```bash
# Push migrations to Supabase
supabase db push

# Or run a specific migration
supabase migration up
```

### Method 2: Using Supabase Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**

### Method 3: Using MCP in Cursor

If you have Supabase MCP configured in Cursor, you can ask:

```
"Run the SQL migration from supabase/migrations/001_initial_schema.sql"
```

Or:

```
"Execute this SQL in Supabase: [paste your SQL here]"
```

## Common Database Operations

### Creating a New Migration

1. Create a new file in `supabase/migrations/`:
```bash
touch supabase/migrations/002_add_notifications.sql
```

2. Write your SQL:
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Run the migration using one of the methods above.

### Querying Data

You can query data directly using Supabase MCP:

```
"Query all users from the users table in Supabase"
```

Or write custom queries:

```
"Run this SQL query in Supabase: SELECT * FROM workspaces WHERE user_id = 'some-id'"
```

### Modifying Schema

To add a column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
```

To modify a column:

```sql
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(255);
```

### Using Supabase MCP for Common Tasks

1. **Check table structure**:
   ```
   "Show me the schema for the users table in Supabase"
   ```

2. **View data**:
   ```
   "Get all workspaces for user [user-id] from Supabase"
   ```

3. **Insert data**:
   ```
   "Insert a new workspace in Supabase with name 'Test' and user_id '...'"
   ```

4. **Update data**:
   ```
   "Update the workspace with id '...' to set name to 'Updated Name'"
   ```

5. **Delete data**:
   ```
   "Delete the workspace with id '...' from Supabase"
   ```

## Migration Best Practices

1. **Always backup before migrations**: Use Supabase dashboard to create a backup before running destructive migrations.

2. **Test migrations locally first**: If possible, test migrations on a local Supabase instance.

3. **Use transactions**: Wrap migrations in transactions when possible:
   ```sql
   BEGIN;
   -- your migration SQL
   COMMIT;
   ```

4. **Version your migrations**: Name migration files with sequential numbers: `001_`, `002_`, etc.

5. **Document changes**: Add comments in your SQL files explaining what each migration does.

## Troubleshooting

### Migration Fails

If a migration fails:

1. Check the error message in Supabase dashboard
2. Verify your SQL syntax
3. Check if tables/columns already exist
4. Use `IF NOT EXISTS` or `IF EXISTS` clauses to make migrations idempotent

### Connection Issues

- Verify your `SUPABASE_URL` and keys are correct
- Check that your IP is allowed (for local development, Supabase allows all IPs by default)
- Ensure you're using the correct project reference

### Rollback

To rollback a migration:

1. Create a new migration file that reverses the changes
2. Or manually fix the schema in Supabase dashboard
3. Document the rollback in your migration history

## Example: Adding a New Feature

Let's say you want to add a "favorites" feature:

1. Create migration: `supabase/migrations/002_add_favorites.sql`
```sql
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
```

2. Run the migration using Supabase MCP or CLI

3. Update your TypeScript types in `lib/db/supabase.ts`

4. Add query functions in `lib/db/queries.ts`

## Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Quick Reference

```bash
# Link project
supabase link --project-ref [PROJECT-REF]

# Push migrations
supabase db push

# Create new migration
supabase migration new [migration_name]

# Reset database (WARNING: deletes all data)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --project-id [PROJECT-REF] > types/supabase.ts
```

