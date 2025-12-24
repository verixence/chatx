# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Supabase Credentials (2 minutes)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. **Create a new project** (or use existing)
   - Name: `LearnChat`
   - Password: Choose a strong password (save it!)
   - Region: Choose closest to you
3. Wait ~2 minutes for project to be created
4. Go to **Settings** → **API**
5. Copy these 3 values: 
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret! 
 
### Step 2: Set Up Environment Variables (1 minute) 
 
```bash 
# Copy the example file 
cp .env.example .env

# Edit .env and add your Supabase credentials
# Also add your AI API keys (you already have these)
```

Generate NextAuth secret:
```bash
openssl rand -base64 32
```
Copy the output to `NEXTAUTH_SECRET` in `.env`

### Step 3: Run Database Migration (1 minute)
 
**Easiest way - Using Supabase Dashboard:**

1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Open `supabase/migrations/001_initial_schema.sql` in your editor
5. Copy all the SQL
6. Paste into Supabase SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. ✅ You should see "Success. No rows returned"

### Step 4: Install & Run (1 minute)

```bash
# Install dependencies (already done, but just in case)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## ✅ That's It!

Your app should now be running. You can:
- Sign up for a new account
- Create a workspace
- Upload content (PDF, YouTube, or text)
- Chat with your content
- Generate quizzes and flashcards

## 📝 Optional: Set Up Storage Bucket

The storage bucket will be created automatically on first upload, but you can create it manually:

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `learnchat-files`
4. Make it **Private**
5. Click **Create**

## 🆘 Troubleshooting

**"Missing Supabase environment variables" error:**
- Check that all 4 Supabase variables are set in `.env`
- Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set (needed for client-side)

**"Table doesn't exist" error:**
- Make sure you ran the migration (Step 3)
- Check Supabase dashboard → Table Editor to verify tables exist

**"Invalid API key" error:**
- Double-check you copied the keys correctly
- Make sure you're using the right project's keys

## 📚 Next Steps

- Read `SETUP_SUMMARY.md` for detailed setup
- See `YOUTUBE_API_SETUP.md` if you want YouTube API
- Check `VECTOR_DB_EXPLANATION.md` to understand vector DB (optional)

