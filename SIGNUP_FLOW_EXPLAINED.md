# User Signup Flow - Complete Guide

This document explains how users with different subscription tiers can sign up for ChatX.

## Overview

ChatX supports three subscription tiers:
- **Freemium**: Free tier with 14-day trial and limited features
- **Pro**: $9.99/month - Unlimited features
- **Enterprise**: $49/user/year - Everything in Pro + team features

## Signup Flow Options

### 1. **Freemium Signup (Default)**

This is the default signup flow - no plan parameter needed.

#### Steps:
1. User visits `/signup` page
2. User fills out form (name, email, password)
3. User clicks "Sign up"
4. System creates account with:
   - `subscription: 'freemium'`
   - `subscription_status: 'trial'`
   - `subscription_start_date: now`
   - `subscription_end_date: now + 14 days` (14-day free trial)
5. User is redirected to `/login?registered=true`
6. User logs in and gets redirected to `/dashboard`
7. User has access to freemium features for 14 days (trial period)

#### What User Gets During Trial:
- ✅ 5 content items (PDF, YouTube, text uploads)
- ✅ 20 AI chat requests per day
- ✅ Basic quizzes & flashcards (limited)
- ✅ All premium features unlocked during trial

#### After 14-Day Trial:
- Trial expires
- User is blocked from:
  - Creating new content
  - Using AI chat
  - Generating quizzes/flashcards
- User must upgrade to Pro to continue

---

### 2. **Direct Pro Signup (Coming Soon)**

Currently, users cannot sign up directly for Pro. However, the infrastructure is in place:

#### How It Would Work:
1. User visits `/signup?plan=pro`
2. User fills out signup form
3. User clicks "Sign up"
4. System creates account with `subscription: 'freemium'` (still starts as freemium)
5. User is redirected to `/login?registered=true&plan=pro`
6. After login, user is redirected to `/dashboard/settings?upgrade=pro`
7. User clicks "Upgrade to Pro" button
8. User is redirected to Stripe Checkout
9. User completes payment
10. Webhook activates Pro subscription
11. User gets Pro features immediately

#### Current Implementation:
The signup page reads the `?plan=pro` parameter, but:
- **User still starts as freemium** (gets 14-day trial)
- After login, they're redirected to upgrade flow
- This is intentional - allows users to try before buying

---

### 3. **Direct Enterprise Signup (Coming Soon)**

Similar to Pro signup:

1. User visits `/signup?plan=enterprise`
2. User signs up
3. Gets freemium account with trial
4. After login, redirected to upgrade flow
5. Can upgrade to Enterprise via Stripe

---

## Current Signup Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER WANTS TO SIGNUP                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   Visit /signup      │
            │  (optional: ?plan=)  │
            └──────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Fill Signup Form    │
        │  (name, email, pwd)  │
        └──────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  POST /api/auth/signup   │
    │                          │
    │  Creates user with:      │
    │  - subscription: freemium│
    │  - status: 'trial'       │
    │  - end_date: +14 days    │
    └──────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │  Redirect to /login      │
    │  ?registered=true        │
    │  &plan=pro (if provided) │
    └──────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │  User Logs In            │
    └──────┬───────────────────┘
           │
           ├─ No plan param ──────────► /dashboard (trial access)
           │
           └─ plan=pro/enterprise ────► /dashboard/settings?upgrade=plan
                                          │
                                          ▼
                                    Upgrade Flow
                                    (Stripe Checkout)
```

## Detailed Flow Breakdown

### Step 1: Signup Page (`app/(auth)/signup/page.tsx`)

```typescript
// Reads optional plan parameter
const plan = searchParams?.get("plan") || null  // 'pro' | 'enterprise' | null

// On form submit
const response = await fetch("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ name, email, password }),  // Note: plan NOT sent
})

// After successful signup
if (plan && (plan === 'pro' || plan === 'enterprise')) {
  router.push(`/login?registered=true&plan=${plan}`)
} else {
  router.push("/login?registered=true")
}
```

**Key Point**: The plan parameter is passed through the flow but doesn't affect initial account creation. All users start as freemium with trial.

### Step 2: Signup API (`app/api/auth/signup/route.ts`)

```typescript
// Creates user with createUser()
const user = await createUser({
  email,
  name,
  password_hash,
  subscription: "freemium",  // Always freemium initially
})
```

**Key Point**: All users are created as `freemium` regardless of any plan parameter. This ensures everyone gets a trial period.

### Step 3: User Creation (`lib/db/queries.ts`)

```typescript
export async function createUser(userData) {
  const now = new Date()
  const subscription = userData.subscription || 'freemium'
  const isFreemium = subscription === 'freemium'
  
  // For freemium users, set up 14-day free trial
  const trialEndDate = isFreemium 
    ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days
    : null

  const insertData = {
    subscription: 'freemium',  // Always freemium
    subscription_status: 'trial',  // Trial status
    subscription_start_date: now.toISOString(),
    subscription_end_date: trialEndDate?.toISOString(),  // 14 days from now
    // ... other fields
  }
}
```

**Key Point**: New freemium users get:
- `subscription: 'freemium'`
- `subscription_status: 'trial'`
- `subscription_end_date: now + 14 days`
- Access to all features during trial

### Step 4: Login Flow (`app/(auth)/login/page.tsx`)

```typescript
const plan = searchParams?.get("plan")  // From signup redirect

// After successful login
if (plan && (plan === 'pro' || plan === 'enterprise')) {
  router.push(`/dashboard/settings?upgrade=${plan}`)
} else {
  router.push("/dashboard")
}
```

**Key Point**: If a plan was specified, user is redirected to upgrade flow. Otherwise, goes to dashboard with trial access.

### Step 5: Upgrade Flow (If Plan Specified)

1. User lands on `/dashboard/settings?upgrade=pro`
2. `SubscriptionManagement` component shows upgrade options
3. User clicks "Upgrade to Pro"
4. System calls `/api/stripe/checkout?plan=pro`
5. User redirected to Stripe Checkout
6. User completes payment
7. Webhook activates subscription
8. User gets Pro features

## Subscription Tiers Comparison

| Feature | Freemium (Trial) | Freemium (After Trial) | Pro | Enterprise |
|---------|-----------------|----------------------|-----|-----------|
| **Signup Flow** | Default `/signup` | Same (but expired) | `/signup?plan=pro` → Upgrade | `/signup?plan=enterprise` → Upgrade |
| **Content Items** | 5 (unlimited during trial) | 5 (blocked if over) | Unlimited | Unlimited |
| **AI Requests/Day** | 20 (unlimited during trial) | 20 (blocked if exceeded) | Unlimited | Unlimited |
| **Quizzes** | Limited (unlimited during trial) | Blocked | Unlimited | Unlimited |
| **Flashcards** | Limited (unlimited during trial) | Blocked | Unlimited | Unlimited |
| **Cost** | Free (14-day trial) | Free (but limited) | $9.99/month | $49/user/year |
| **Payment** | None | None | Stripe Checkout | Stripe Checkout |

## Key Design Decisions

### Why All Users Start as Freemium?

1. **Trial Period**: Everyone gets 14 days to try premium features
2. **Lower Friction**: No payment required upfront
3. **Better Conversion**: Users experience value before paying
4. **Unified Onboarding**: Same signup flow for everyone

### Why Plan Parameter Exists?

1. **Marketing Links**: Can link directly to upgrade flow from marketing page
2. **A/B Testing**: Can test different signup flows
3. **Future Enhancement**: Could enable direct paid signup later
4. **Analytics**: Track which plan users are interested in

## Future Enhancements

### Direct Paid Signup (Not Currently Implemented)

If you wanted users to pay immediately (skip trial):

```typescript
// In createUser(), could check for direct signup
if (userData.plan === 'pro' && userData.paymentIntent) {
  // Create user with Pro subscription immediately
  // Skip trial, go straight to Stripe checkout
}
```

This would require:
- Payment intent creation before signup
- Modified signup API to handle payment
- Different user creation flow

### Current Approach Benefits

- ✅ Simple signup flow (no payment complexity)
- ✅ Everyone gets to try before buying
- ✅ Higher conversion (users see value first)
- ✅ Easier to implement and maintain

## Testing the Flows

### Test Freemium Signup:
1. Go to `http://localhost:3000/signup`
2. Fill form and submit
3. Login
4. Verify trial status in settings

### Test Pro Signup Flow:
1. Go to `http://localhost:3000/signup?plan=pro`
2. Fill form and submit
3. Login
4. Should redirect to settings with upgrade prompt
5. Click "Upgrade to Pro"
6. (Stripe checkout - requires Stripe keys)

## Summary

**Current Implementation:**
- All users sign up as **freemium** with **14-day trial**
- Plan parameter (`?plan=pro`) redirects to upgrade flow after login
- Upgrade happens via Stripe Checkout
- Trial gives full access to premium features

**User Experience:**
1. Sign up → Get 14-day trial
2. Try premium features for free
3. After 14 days → Must upgrade or access is limited
4. Upgrade anytime during or after trial via settings

This approach maximizes trial signups and conversions while keeping the signup process simple and friction-free.

