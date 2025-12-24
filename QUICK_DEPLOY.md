# Quick Deployment Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository
3. **Add Environment Variables** (click "Environment Variables" button):

   **Copy-paste these variables** (replace with your actual values):

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   AI_PROVIDER=openai
   OPENAI_API_KEY=your-openai-key
   ```

4. Click **Deploy**
5. Wait ~2 minutes for build to complete
6. ✅ Your app is live!

### Step 3: Update NEXTAUTH_URL

After first deployment:
1. Go to Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to: `https://your-actual-app-name.vercel.app`
3. Redeploy or wait for next deployment

### Step 4: Test

Visit your app URL and test:
- ✅ Sign up / Login
- ✅ Create workspace
- ✅ Upload PDF
- ✅ Upload YouTube video
- ✅ Chat with content

---

## 📋 All Environment Variables

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_SUPABASE_URL` - Same as SUPABASE_URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional:**
- `SUPADATA_API_KEY` - For YouTube transcripts
- `GOOGLE_CLIENT_ID` - For Google sign-in
- `GOOGLE_CLIENT_SECRET` - For Google sign-in
- `YOUTUBE_API_KEY` - For YouTube metadata

---

## 🐛 Troubleshooting

**Build fails?**
- Check all required environment variables are set
- Try building locally: `npm run build`

**401/403 errors?**
- Check `NEXTAUTH_URL` matches your actual Vercel URL
- Verify `NEXTAUTH_SECRET` is set

**Database errors?**
- Verify Supabase credentials are correct
- Check database migrations are applied

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

