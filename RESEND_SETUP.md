# Resend Email Integration Setup

## Overview

The email notification system is now integrated with Resend. All subscription-related emails are sent through Resend.

## Environment Variables Required

Add these to your `.env.local` file (for local development) and to your hosting platform (Vercel, etc.):

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Sender Email (must be verified in Resend)
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Reply-To Email (optional, defaults to info@verixence.com)
RESEND_REPLY_TO_EMAIL=info@verixence.com
```

## Getting Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Sign in to your account
3. Click "Create API Key"
4. Give it a name (e.g., "ChatX Production")
5. Copy the API key (starts with `re_`)
6. Add it to your environment variables

## Verifying Your Domain (Recommended for Production)

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Follow the DNS verification steps
4. Once verified, update `RESEND_FROM_EMAIL` to use your domain (e.g., `noreply@yourdomain.com`)

## Domain Verification Required

**Important**: The system is configured to use `info@verixence.com` as the sender email. You must verify the `verixence.com` domain in Resend for this to work.

### Steps to Verify Domain:
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `verixence.com`
4. Add the required DNS records (SPF, DKIM, DMARC)
5. Wait for verification (usually takes a few minutes)

### Using Test Domain (Temporary)

If you need to test before verifying your domain, you can temporarily set:
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

But for production, you should verify `verixence.com` and use `info@verixence.com`.

## Email Notifications Implemented

The system sends emails for:

1. **Trial Ending Soon** - Sent when trial has 3 days remaining
2. **Trial Expired** - Sent when trial period ends
3. **Payment Failed** - Sent when subscription payment fails
4. **Subscription Cancelled** - Sent when user cancels subscription
5. **Subscription Renewed** - Sent when subscription renews successfully

## Testing

### Test Mode
- Resend free tier includes test emails
- You can test sending emails by triggering subscription events
- Check your Resend dashboard for email logs and delivery status

### Production
- Verify your domain in Resend
- Update `RESEND_FROM_EMAIL` to your verified domain
- Monitor email delivery in Resend dashboard

## Email Templates

All emails include:
- Professional HTML formatting
- Clear call-to-action buttons
- Contact information (info@verixence.com)
- Responsive design for mobile devices

## Troubleshooting

### Emails Not Sending
1. Check that `RESEND_API_KEY` is set correctly
2. Verify API key is active in Resend dashboard
3. Check server logs for error messages
4. Verify sender email is valid (use `onboarding@resend.dev` for testing)

### Domain Verification Issues
- Ensure DNS records are correctly set
- Wait for DNS propagation (can take up to 24 hours)
- Check Resend dashboard for verification status

### Rate Limits
- Resend free tier: 100 emails/day
- Upgrade plan if you need more volume
- Check Resend dashboard for usage statistics

## Support

For Resend-specific issues:
- [Resend Documentation](https://resend.com/docs)
- [Resend Support](https://resend.com/support)

For application issues:
- Contact: info@verixence.com

