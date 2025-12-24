/**
 * Email Notification System
 * 
 * Handles email notifications for subscription events using Resend
 */

import { Resend } from 'resend'

// Get sender email from environment variable or use default
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'info@verixence.com'
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'info@verixence.com'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Get Resend client instance (lazy initialization)
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

/**
 * Send email notification using Resend
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if Resend API key is configured
    const resend = getResendClient()
    if (!resend) {
      console.error('RESEND_API_KEY is not configured. Email not sent.')
      return false
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      replyTo: REPLY_TO_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error('Resend email error:', error)
      return false
    }

    console.log('Email sent successfully:', data)
    return true
  } catch (error) {
    console.error('Exception sending email:', error)
    return false
  }
}

/**
 * Send trial ending soon notification (3 days before expiration)
 */
export async function sendTrialEndingSoonEmail(
  email: string,
  daysRemaining: number
): Promise<boolean> {
  const subject = `Your ChatX trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Free Trial is Ending Soon</h2>
      <p>Hi there,</p>
      <p>Your 14-day free trial of ChatX Pro features ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.</p>
      <p>Don't lose access to unlimited content, AI features, and premium capabilities. Upgrade to Pro now to continue enjoying:</p>
      <ul>
        <li>Unlimited content items</li>
        <li>Unlimited AI requests</li>
        <li>Unlimited quizzes & flashcards</li>
        <li>Advanced AI features</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard/settings" style="background-color: #EFA07F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Upgrade to Pro</a></p>
      <p>Questions? Reply to this email or contact us at info@verixence.com</p>
      <p>Best regards,<br>The ChatX Team</p>
    </div>
  `
  
  return sendEmail({ to: email, subject, html })
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredEmail(email: string): Promise<boolean> {
  const subject = 'Your ChatX trial has ended'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Free Trial Has Ended</h2>
      <p>Hi there,</p>
      <p>Your 14-day free trial of ChatX Pro features has ended.</p>
      <p>Upgrade to Pro now to regain access to all premium features:</p>
      <ul>
        <li>Unlimited content items</li>
        <li>Unlimited AI requests</li>
        <li>Unlimited quizzes & flashcards</li>
        <li>Advanced AI features</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard/settings" style="background-color: #EFA07F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Upgrade to Pro</a></p>
      <p>Questions? Reply to this email or contact us at info@verixence.com</p>
      <p>Best regards,<br>The ChatX Team</p>
    </div>
  `
  
  return sendEmail({ to: email, subject, html })
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(email: string, gracePeriodDays: number = 7): Promise<boolean> {
  const subject = 'Payment failed - Update your payment method'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Failed</h2>
      <p>Hi there,</p>
      <p>We were unable to process your payment for your ChatX subscription.</p>
      <p>You have ${gracePeriodDays} days to update your payment method before your subscription is paused.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard/settings" style="background-color: #EFA07F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Update Payment Method</a></p>
      <p>If you have any questions, please contact us at info@verixence.com</p>
      <p>Best regards,<br>The ChatX Team</p>
    </div>
  `
  
  return sendEmail({ to: email, subject, html })
}

/**
 * Send subscription cancelled notification
 */
export async function sendSubscriptionCancelledEmail(email: string): Promise<boolean> {
  const subject = 'Your ChatX subscription has been cancelled'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Subscription Cancelled</h2>
      <p>Hi there,</p>
      <p>Your ChatX subscription has been cancelled. You'll continue to have access until the end of your current billing period.</p>
      <p>We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard/settings" style="background-color: #EFA07F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reactivate Subscription</a></p>
      <p>Questions or feedback? Contact us at info@verixence.com</p>
      <p>Best regards,<br>The ChatX Team</p>
    </div>
  `
  
  return sendEmail({ to: email, subject, html })
}

/**
 * Send subscription renewed notification
 */
export async function sendSubscriptionRenewedEmail(email: string, plan: string): Promise<boolean> {
  const subject = `Your ChatX ${plan} subscription has been renewed`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Subscription Renewed</h2>
      <p>Hi there,</p>
      <p>Your ChatX ${plan} subscription has been successfully renewed!</p>
      <p>Thank you for continuing to use ChatX. You'll continue to enjoy all premium features.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard" style="background-color: #EFA07F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Go to Dashboard</a></p>
      <p>Questions? Reply to this email or contact us at info@verixence.com</p>
      <p>Best regards,<br>The ChatX Team</p>
    </div>
  `
  
  return sendEmail({ to: email, subject, html })
}

