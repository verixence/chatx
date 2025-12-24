# Stripe Integration Setup Guide

This document explains how to set up Stripe integration for subscription payments.

## Overview

The Stripe integration is already implemented and ready to use. You just need to:
1. Create a Stripe account
2. Get your API keys
3. Create products and prices in Stripe
4. Set up environment variables
5. Configure webhook endpoint

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Complete account setup

## Step 2: Get API Keys

1. Go to Developers → API keys in Stripe Dashboard
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)
4. Keep these secure - never commit them to version control

## Step 3: Create Products and Prices

### Create Pro Plan

1. Go to Products → Add product
2. Name: "ChatX Pro"
3. Description: "Unlimited content, AI features, and premium support"
4. Pricing model: Recurring
5. Price: $9.99 USD
6. Billing period: Monthly
7. Copy the **Price ID** (starts with `price_`)

### Create Enterprise Plan

1. Go to Products → Add product
2. Name: "ChatX Enterprise"
3. Description: "Everything in Pro plus team features and dedicated support"
4. Pricing model: Recurring
5. Price: $49.00 USD
6. Billing period: Yearly
7. Copy the **Price ID** (starts with `price_`)

## Step 4: Set Environment Variables

Add these to your `.env.local` file (for local development) and to your hosting platform (Vercel, etc.):

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... (use sk_live_... for production)
STRIPE_PUBLISHABLE_KEY=pk_test_... (use pk_live_... for production)

# Stripe Price IDs
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...

# Stripe Webhook Secret (see Step 5)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)
```

## Step 5: Set Up Webhook Endpoint

### For Local Development

Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will give you a webhook signing secret (starts with `whsec_`). Add it to `.env.local`.

### For Production

1. Go to Developers → Webhooks in Stripe Dashboard
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your environment variables

## Step 6: Enable Customer Portal (Optional)

1. Go to Settings → Billing → Customer portal in Stripe Dashboard
2. Enable customer portal
3. Configure settings:
   - Allow customers to cancel subscriptions
   - Allow customers to update payment methods
   - Allow customers to view invoices

## Testing

### Test Mode

- Use test API keys (start with `pk_test_` and `sk_test_`)
- Use test card numbers: `4242 4242 4242 4242`
- Use any future expiry date and any 3-digit CVC
- Use any postal code

### Test Flow

1. User clicks "Upgrade to Pro" in settings
2. Redirects to Stripe Checkout
3. Enter test card details
4. Complete payment
5. Webhook updates user subscription in database
6. User sees Pro features enabled

## Features Implemented

✅ **Checkout Flow**
- Creates Stripe Checkout session
- Handles Pro and Enterprise plans
- Redirects to Stripe payment page
- Returns to settings after payment

✅ **Webhook Handler**
- Processes checkout completion
- Updates subscription status
- Handles subscription updates
- Handles cancellations
- Handles payment failures

✅ **Customer Portal**
- "Manage Subscription" button for Pro/Enterprise users
- Update payment methods
- View invoices
- Cancel subscriptions

✅ **Graceful Fallback**
- Works without Stripe keys (shows helpful message)
- Checks if Stripe is configured before use
- Returns appropriate error codes

## API Endpoints

- `POST /api/stripe/checkout?plan=pro` - Create checkout session
- `GET /api/stripe/checkout?session_id=xxx` - Get session status
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/stripe/portal` - Create customer portal session

## Security Notes

- Never commit Stripe keys to version control
- Use environment variables for all secrets
- Always verify webhook signatures
- Use HTTPS in production
- Use test keys for development, live keys for production

## Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs for errors
2. Check webhook events in Stripe Dashboard
3. Check server logs for webhook processing errors
4. Verify environment variables are set correctly

