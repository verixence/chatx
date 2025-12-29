# ChatX Deployment Plan

**Production Deployment Strategy for Web & Mobile Apps**

---

## Table of Contents
1. [Web App Deployment (Vercel)](#web-app-deployment)
2. [Mobile App Deployment](#mobile-app-deployment)
3. [Environment Variables](#environment-variables)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Post-Deployment Monitoring](#post-deployment-monitoring)

---

## Web App Deployment (Vercel)

### Current Status
- Framework: Next.js 14
- Hosting: Vercel (recommended)
- Database: Supabase (PostgreSQL + Vector DB)
- File Storage: Supabase Storage

### Deployment Steps

#### 1. Prepare for Deployment

```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Test the build locally
cd /Users/Dhanush/Documents/GitHub/chatx_new
npm run build

# Verify build succeeds without errors
```

#### 2. Configure Vercel Project

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables
vercel env pull .env.local
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub: `chatx_new` repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (monorepo root)
   - **Build Command**: `npm run build --workspace=web`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `npm install`

#### 3. Configure Environment Variables in Vercel

Add these to Vercel Dashboard → Settings → Environment Variables:

```bash
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://your-domain.vercel.app

# AI Services
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key

# YouTube API (if using)
YOUTUBE_API_KEY=your_youtube_key

# Email (Resend)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 4. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

#### 5. Custom Domain Setup

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., `chatx.app`)
3. Configure DNS records as instructed
4. Update `NEXTAUTH_URL` to use custom domain

---

## Mobile App Deployment

### Current Status
- Framework: React Native with Expo SDK 54
- Platforms: iOS & Android
- Distribution: App Store & Google Play Store

### Deployment Options

#### Option 1: Expo Application Services (EAS) - Recommended

**Advantages:**
- Simplified build process
- Cloud builds (no need for Mac/PC)
- Automatic OTA updates
- Easy to manage

**Setup EAS:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS for your project
cd apps/mobile
eas build:configure

# Create production builds
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Update EAS Configuration** (`apps/mobile/eas.json`):

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "bundleIdentifier": "com.yourcompany.chatx",
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

#### Android Deployment

**1. Prepare Android Build:**

```bash
# Build Android App Bundle (AAB)
eas build --platform android --profile production

# Or build APK for testing
eas build --platform android --profile preview
```

**2. Google Play Console Setup:**

1. Create app at https://play.google.com/console
2. Complete store listing:
   - App name: ChatX
   - Description: AI-powered learning assistant
   - Screenshots (1080x1920px minimum)
   - Feature graphic (1024x500px)
   - App icon (512x512px)
3. Set up pricing & distribution
4. Configure app content ratings
5. Upload AAB file

**3. Submit to Google Play:**

```bash
# Using EAS Submit
eas submit --platform android --profile production

# Or manually upload AAB to Google Play Console
```

#### iOS Deployment

**1. Prepare iOS Build:**

```bash
# Build iOS app
eas build --platform ios --profile production
```

**2. App Store Connect Setup:**

1. Create app at https://appstoreconnect.apple.com
2. Configure:
   - Bundle ID: `com.yourcompany.chatx`
   - App name: ChatX
   - Category: Education
   - Privacy Policy URL
   - Screenshots (various iPhone sizes)
3. Complete App Store information
4. Set pricing & availability

**3. Submit to App Store:**

```bash
# Using EAS Submit
eas submit --platform ios --profile production

# Or use Xcode/Transporter to upload manually
```

---

## Environment Variables

### Mobile App (.env)

Create `apps/mobile/.env`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://your-domain.vercel.app
EXPO_PUBLIC_WEB_URL=https://your-domain.vercel.app

# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (for in-app purchases)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Web App (.env.local)

Already configured - ensure all production values are set in Vercel.

---

## Pre-Deployment Checklist

### Web App
- [ ] All environment variables configured in Vercel
- [ ] Build succeeds locally (`npm run build`)
- [ ] Database migrations applied
- [ ] Supabase RLS policies configured
- [ ] Stripe webhooks configured
- [ ] Custom domain DNS configured
- [ ] SSL certificate active
- [ ] Error tracking setup (Sentry recommended)
- [ ] Analytics configured (Google Analytics/Posthog)

### Mobile App
- [ ] App icons created (all sizes)
- [ ] Splash screens created
- [ ] App.json metadata updated:
  - App name
  - Bundle identifier
  - Version number
  - Permissions
- [ ] Privacy policy URL set
- [ ] Terms of service URL set
- [ ] Store listings prepared:
  - Screenshots (iOS & Android)
  - Descriptions
  - Keywords
- [ ] Payment processing configured (if needed)
- [ ] Push notifications setup (if needed)

---

## Post-Deployment Monitoring

### Web App Monitoring

1. **Vercel Analytics**
   - Monitor performance
   - Track errors
   - View traffic

2. **Database Monitoring**
   - Supabase Dashboard → Database
   - Check query performance
   - Monitor storage usage

3. **Set Up Alerts**
   ```bash
   # Install Sentry for error tracking
   npm install @sentry/nextjs
   ```

### Mobile App Monitoring

1. **Expo Analytics**
   - Track app usage
   - Monitor crashes
   - OTA update adoption

2. **App Store/Play Console**
   - Monitor reviews
   - Track downloads
   - Check crash reports

---

## Update Strategy

### Web App Updates
```bash
# Deploy updates
git push origin main  # Auto-deploys to Vercel
```

### Mobile App Updates

**Option 1: OTA Updates (Instant)**
```bash
# For minor updates (no native code changes)
eas update --branch production --message "Bug fixes"
```

**Option 2: New Build (Requires Review)**
```bash
# For major updates or native code changes
eas build --platform all --profile production
eas submit --platform all --profile production
```

---

## Rollback Strategy

### Web App
```bash
# Via Vercel Dashboard
# Deployments → Select previous → Promote to Production

# Or via CLI
vercel rollback
```

### Mobile App
```bash
# Rollback OTA update
eas update:republish --branch production --group <previous-group-id>

# For store builds, submit previous version
```

---

## Cost Estimates

### Monthly Costs (Estimated)

**Infrastructure:**
- Vercel Pro: $20/month (includes 100GB bandwidth)
- Supabase Pro: $25/month (8GB database, 100GB storage)
- Total Infrastructure: ~$45/month

**AI Services (Usage-based):**
- OpenAI API: ~$50-200/month (depending on usage)
- Groq API: Free tier available, then pay-as-you-go

**Optional Services:**
- Stripe: 2.9% + $0.30 per transaction
- Resend Email: Free tier (3,000 emails/month), then $20/month
- Expo EAS: Free tier available, Pro $29/month

**Total Estimated Monthly Cost: $100-300** (scales with usage)

---

## Support & Maintenance

### Regular Tasks
1. **Weekly:**
   - Review error logs
   - Check user feedback
   - Monitor performance metrics

2. **Monthly:**
   - Update dependencies (`npm update`)
   - Review and optimize database queries
   - Check AI API costs and usage

3. **Quarterly:**
   - Security audit
   - Performance optimization
   - Feature roadmap review

---

## Emergency Contacts

- **Hosting Issues**: Vercel Support (dashboard)
- **Database Issues**: Supabase Support
- **Payment Issues**: Stripe Support
- **App Store Issues**: Apple Developer Support
- **Play Store Issues**: Google Play Support

---

## Next Steps

1. **Immediate:**
   - Deploy web app to Vercel
   - Test all features in production
   - Configure custom domain

2. **Short-term (1-2 weeks):**
   - Build Android APK for testing
   - Submit to Google Play (internal testing)
   - Build iOS app for TestFlight

3. **Medium-term (1 month):**
   - Public release on App Stores
   - Set up monitoring and analytics
   - Collect user feedback

---

**Last Updated:** December 29, 2024
**Deployment Status:** Ready for Production
