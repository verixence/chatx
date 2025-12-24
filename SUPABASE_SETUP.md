# Supabase Setup Guide for LearnChat

This guide will help you set up Supabase for the LearnChat application using Supabase MCP (Model Context Protocol).

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: LearnChat (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development

5. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon/public key**: This is your `SUPABASE_ANON_KEY`
   - **service_role key**: This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. Go to **Settings** → **Database**
4. Under **Connection string**, select **URI**
5. Copy the connection string - you'll need this for:
   - **DATABASE_URL**: Use the "Connection pooling" URL (port 6543)
   - **DIRECT_URL**: Use the "Direct connection" URL (port 5432)

## Step 3: Run Database Migrations

### Option A: Using Supabase MCP (Recommended)

If you have Supabase MCP configured in Cursor:

1. Open the SQL migration file: `supabase/migrations/001_initial_schema.sql`
2. Use the Supabase MCP to execute the migration:
   - Ask: "Run the SQL migration from supabase/migrations/001_initial_schema.sql"
   - Or use the MCP tool to execute SQL directly

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify all tables were created successfully

### Option C: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref [YOUR-PROJECT-REF]

# Run migrations
supabase db push
```

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

Replace:
- `[PROJECT-REF]` with your project reference ID
- `[PASSWORD]` with your database password
- `[REGION]` with your region (e.g., `us-east-1`)

## Step 5: Verify Database Setup

You can verify your tables were created by:

1. Going to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - users
   - workspaces
   - contents
   - processed_contents
   - chat_sessions
   - quizzes
   - quiz_attempts
   - flashcards
   - flashcard_reviews
   - user_progress

## Step 6: Set Up Row Level Security (RLS) - Optional but Recommended

For production, you should enable RLS policies. Create a new migration:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Example policy: Users can only see their own workspaces
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid()::text = user_id::text);
```

## Using Supabase MCP for Operations

Once Supabase MCP is configured, you can use it for:

1. **Running Migrations**:
   ```
   "Run SQL migration from supabase/migrations/001_initial_schema.sql"
   ```

2. **Querying Data**:
   ```
   "Query all users from the users table"
   ```

3. **Creating Tables**:
   ```
   "Create a new table for notifications"
   ```

4. **Modifying Schema**:
   ```
   "Add a new column 'avatar_url' to the users table"
   ```

## Troubleshooting

### Connection Issues
- Make sure your IP is allowed in Supabase dashboard (Settings → Database → Connection pooling)
- For local development, Supabase allows all IPs by default

### Migration Errors
- Check that the UUID extension is enabled
- Verify you're using the correct database (not the template database)
- Make sure you have the necessary permissions

### Environment Variables
- Double-check all Supabase URLs and keys are correct
- Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set for client-side operations
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (server-side only)

## Next Steps

1. Install dependencies: `npm install`
2. Generate NextAuth secret: `openssl rand -base64 32`
3. Add your AI provider API keys (OpenAI, etc.)
4. Run the development server: `npm run dev`

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase MCP Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

