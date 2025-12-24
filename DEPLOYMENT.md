# Deployment Guide for LearnChat

This guide will help you deploy LearnChat to production. The recommended platform is **Vercel** (optimized for Next.js), but we also provide instructions for other platforms.

## 🚀 Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications and provides excellent performance and features.

### Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
2. A GitHub/GitLab/Bitbucket account (to connect your repository)
3. Your Supabase project already set up
4. All environment variables ready
 
### Step 1: Prepare Your Repository 

1. **Push your code to GitHub** (or GitLab/Bitbucket):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify your build works locally**:
   ```bash
   npm run build
   ```
   If this fails, fix any build errors before deploying.

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended for first deployment)

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. **Import your repository**:
   - Connect your GitHub/GitLab/Bitbucket account if needed
   - Select the `LearnChat` repository
   - Click **Import**

3. **Configure the project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**:
   
   Click **Environment Variables** and add all required variables:

   **Required Environment Variables:**
   ```env
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # NextAuth
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-nextauth-secret-here
   
   # AI Provider
   AI_PROVIDER=openai
   OPENAI_API_KEY=your-openai-api-key
   ```

   **Optional Environment Variables:**
   ```env
   # YouTube
   YOUTUBE_API_KEY=your-youtube-api-key
   SUPADATA_API_KEY=your-supadata-api-key
   
   # Google OAuth (for sign-in)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Stripe (for billing)
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

   **Important**: 
   - Make sure to add these for **Production**, **Preview**, and **Development** environments (or at least Production)
   - After adding variables, you may need to redeploy

5. **Deploy**:
   - Click **Deploy**
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be available at `https://your-app.vercel.app`

#### Option B: Via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No** (first time)
   - Project name? (press Enter for default)
   - Directory? (press Enter for `./`)
   - Override settings? **No**

4. **Add environment variables**:
   ```bash
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   # ... repeat for all variables
   ```
   
   Or use the dashboard (easier): Go to your project → Settings → Environment Variables

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Step 3: Update NEXTAUTH_URL

After deployment, update `NEXTAUTH_URL` in Vercel environment variables:
- Go to your project → Settings → Environment Variables
- Update `NEXTAUTH_URL` to your production URL: `https://your-app.vercel.app`
- Redeploy (or it will auto-update on next deployment)

### Step 4: Verify Deployment

1. Visit your production URL: `https://your-app.vercel.app`
2. Test the following:
   - ✅ Sign up / Login
   - ✅ Create a workspace
   - ✅ Upload a PDF
   - ✅ Upload YouTube content
   - ✅ Chat with content
   - ✅ Generate quizzes/flashcards

### Step 5: Set Up Custom Domain (Optional)

1. Go to your Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain

---

## 📝 Important Notes for Deployment

### 1. yt-dlp-wrap Limitation

**Important**: The `yt-dlp-wrap` package requires `yt-dlp` binary to be installed on the system. Vercel's serverless functions don't support system binaries by default.

**Solution**: YouTube transcript fetching will fall back to other methods (Supadata.ai, youtube-transcript package, etc.) if `yt-dlp` is not available. The fallback chain will handle this gracefully.

If you need `yt-dlp` support in production, consider:
- Using a Docker deployment (Railway, Fly.io, etc.)
- Using an external service/API for YouTube transcripts (like Supadata.ai, which is already integrated)

### 2. Storage Bucket

The storage bucket (`learnchat-files`) will be automatically created if it doesn't exist (via `initializeBucket()`), but you can create it manually in Supabase Dashboard for better control.

### 3. Environment Variables

- **Never commit** `.env.local` to git
- Always use Vercel's environment variables interface
- Use different values for production vs development
- Rotate secrets regularly

### 4. Build Time vs Runtime Variables

- Variables prefixed with `NEXT_PUBLIC_` are available in the browser
- Other variables are only available server-side
- Use `NEXT_PUBLIC_*` for client-side Supabase initialization

### 5. Database Migrations

Database migrations are already applied (via Supabase MCP or dashboard). No additional migration steps needed during deployment.

---

## 🔧 Other Deployment Platforms

### Railway

1. Connect your GitHub repository
2. Add environment variables
3. Set build command: `npm run build`
4. Set start command: `npm start`

**Note**: Railway supports Docker, so you can use `yt-dlp` if needed.

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create app: `fly launch`
3. Add environment variables: `fly secrets set KEY=value`
4. Deploy: `fly deploy`

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Update `next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
  // ... rest of config
}
```

---

## 🔍 Troubleshooting Deployment Issues

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Try building locally: `npm run build`
4. Check for TypeScript errors: `npm run lint`

### Runtime Errors

1. Check function logs in Vercel dashboard
2. Verify environment variables are correctly set
3. Check Supabase connection
4. Verify database migrations are applied

### Authentication Issues

1. Verify `NEXTAUTH_URL` matches your production URL exactly
2. Check `NEXTAUTH_SECRET` is set
3. Clear browser cookies and try again

### Storage Upload Errors

1. Verify storage bucket exists in Supabase
2. Check storage policies are correct
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

---

## 🚀 Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Database migrations applied
- [ ] Storage bucket created
- [ ] Custom domain configured (if applicable)
- [ ] Test sign up/login
- [ ] Test content upload (PDF, YouTube, Text)
- [ ] Test chat functionality
- [ ] Test quiz/flashcard generation
- [ ] Set up monitoring/logging (optional)
- [ ] Configure backups (Supabase handles this automatically)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

## 🎉 You're Deployed!

Once deployed, your LearnChat application will be accessible to users worldwide. Monitor your Vercel dashboard for analytics, errors, and performance metrics.

