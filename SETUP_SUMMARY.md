# LearnChat Setup Summary

## ✅ What's Been Done

1. **Removed Prisma** - Now using Supabase directly with SQL migrations
2. **Created SQL Migration** - `supabase/migrations/001_initial_schema.sql`
3. **Set up Supabase Client** - `lib/db/supabase.ts` with type definitions
4. **Created Database Queries** - `lib/db/queries.ts` with helper functions
5. **Set up Supabase Storage** - `lib/storage/supabase.ts` for file uploads
6. **Removed Unnecessary Dependencies**:
   - ❌ Stripe (billing not needed)
   - ❌ Redis (caching not needed)
   - ❌ BullMQ (job queue not needed)
   - ❌ Socket.io (real-time not needed)
   - ❌ Google OAuth (not needed)

## 📋 What You Need to Do

### 1. Get Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings** → **API**
4. Copy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key - keep secret!)
### 2. Create `.env` File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Generate NextAuth secret
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Your AI API keys (you already have these)
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
```

### 3. Run Database Migration

**Option A: Using Supabase Dashboard (Easiest)**
1. Go to your Supabase project
2. Click **SQL Editor**
3. Click **New query**
4. Copy contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**

**Option B: Using Supabase MCP**
If you have Supabase MCP configured in Cursor:
```
"Run the SQL migration from supabase/migrations/001_initial_schema.sql"
```

**Option C: Using Supabase CLI**
```bash
npm install -g supabase
supabase login
supabase link --project-ref [YOUR-PROJECT-REF]
supabase db push
```

### 4. Set Up Supabase Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `learnchat-files`
4. Make it **Private**
5. Set file size limit: 100MB
6. Allowed MIME types:
   - `application/pdf`
   - `text/plain`
   - `video/mp4`
   - `audio/mpeg`
   - `audio/wav`

Or the bucket will be created automatically on first upload.

### 5. Install Dependencies

```bash
npm install
```

### 6. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in your `.env` file.

### 7. (Optional) Get YouTube API Key

See `YOUTUBE_API_SETUP.md` for detailed instructions.

**Note**: YouTube API is optional - the app works without it using the `youtube-transcript` library.

### 8. (Optional) Set Up Vector DB

See `VECTOR_DB_EXPLANATION.md` for details.

**For MVP**: You can skip this and use keyword search (already implemented).

### 9. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 File Structure

```
LearnChat/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # Database schema
├── lib/
│   ├── db/
│   │   ├── supabase.ts               # Supabase client & types
│   │   └── queries.ts                # Database query helpers
│   └── storage/
│       └── supabase.ts               # File storage helpers
├── .env.example                      # Environment variables template
├── SUPABASE_SETUP.md                 # Detailed Supabase setup
├── SUPABASE_MCP_GUIDE.md            # Using Supabase MCP
├── YOUTUBE_API_SETUP.md             # YouTube API guide
└── VECTOR_DB_EXPLANATION.md          # Vector DB explanation
```

## 🔑 Environment Variables Summary

**Required:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AI_PROVIDER` (openai or grok)
- `OPENAI_API_KEY` or `GROK_API_KEY`

**Optional:**
- `YOUTUBE_API_KEY` (see YOUTUBE_API_SETUP.md)
- `PINECONE_API_KEY` (for vector DB - see VECTOR_DB_EXPLANATION.md)

## 🚀 Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database migration
3. ✅ Configure environment variables
4. ✅ Install dependencies
5. ✅ Start development server
6. ✅ Test the application!

## 📚 Documentation

- **Supabase Setup**: `SUPABASE_SETUP.md`
- **Supabase MCP Guide**: `SUPABASE_MCP_GUIDE.md`
- **YouTube API**: `YOUTUBE_API_SETUP.md`
- **Vector DB**: `VECTOR_DB_EXPLANATION.md`

## ❓ Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check that migration ran successfully
- Ensure your IP is allowed (for local dev, Supabase allows all IPs)

### Storage Issues
- Make sure storage bucket exists
- Check bucket permissions
- Verify file size limits

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your dev server URL

## 🎉 You're Ready!

Once you've completed these steps, your LearnChat app should be ready to run!

