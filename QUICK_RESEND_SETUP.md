# Quick Resend Setup Guide

## Add Your Resend API Key

Add this to your `.env.local` file (for local development):

```env
RESEND_API_KEY=re_your_api_key_here
```

For production (Vercel, etc.), add it as an environment variable in your hosting platform.

## Domain Verification Required

**Important**: The system is configured to use `info@verixence.com` as the sender email. You must verify the `verixence.com` domain in Resend for emails to work.

### Steps to Verify Domain:
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `verixence.com`
4. Add the required DNS records (SPF, DKIM, DMARC) to your domain
5. Wait for verification (usually takes a few minutes)

### Temporary Testing (Before Domain Verification)

If you need to test before verifying your domain, you can temporarily override:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

But for production, verify `verixence.com` and use `info@verixence.com` (which is the default).

## That's It! 🎉

Once you add the `RESEND_API_KEY`, all email notifications will work automatically:
- ✅ Trial ending soon emails
- ✅ Trial expired emails  
- ✅ Payment failed emails
- ✅ Subscription cancelled emails
- ✅ Subscription renewed emails

## Testing

After adding your API key, test by:
1. Triggering a subscription event (e.g., trial ending soon)
2. Check your Resend dashboard for email logs
3. Check the recipient's inbox

## Free Tier Limits

Resend free tier includes:
- 100 emails/day
- 3,000 emails/month
- Perfect for getting started!

