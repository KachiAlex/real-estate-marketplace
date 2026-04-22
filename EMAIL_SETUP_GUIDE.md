# Email Setup Guide - SendGrid Integration

## Overview
The forgot password flow now sends actual emails using SendGrid SMTP. This guide will help you configure SendGrid to ensure emails are delivered and not marked as spam.

---

## Step 1: Add Environment Variables to Vercel

You need to add two environment variables to your Vercel project:

### Via Vercel Dashboard:
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add the following variables:

**Variable 1: SENDGRID_API_KEY**
- Name: `SENDGRID_API_KEY`
- Value: `DiGfmDZ0TF6Y5FozzgW-AQ` (your existing key from backend/.env)
- Environment: Production, Preview, Development (select all)

**Variable 2: EMAIL_FROM**
- Name: `EMAIL_FROM`
- Value: `PropertyArk <noreply@propertyark.com>`
- Environment: Production, Preview, Development (select all)

**Variable 3: FRONTEND_URL** (if not already set)
- Name: `FRONTEND_URL`
- Value: `https://real-estate-marketplace-delta.vercel.app`
- Environment: Production, Preview, Development (select all)

3. Click "Save"
4. Redeploy your application for changes to take effect

### Via Vercel CLI:
```bash
vercel env add SENDGRID_API_KEY
# Paste: DiGfmDZ0TF6Y5FozzgW-AQ

vercel env add EMAIL_FROM
# Paste: PropertyArk <noreply@propertyark.com>

vercel env add FRONTEND_URL
# Paste: https://real-estate-marketplace-delta.vercel.app
```

---

## Step 2: Verify SendGrid Sender Email

To avoid emails going to spam, you need to verify your sender email in SendGrid.

### Option A: Single Sender Verification (Quick & Easy)
1. Go to https://app.sendgrid.com/settings/sender_auth/senders
2. Click "Create New Sender"
3. Fill in the form:
   - **From Name**: PropertyArk
   - **From Email Address**: noreply@propertyark.com (or your domain)
   - **Reply To**: support@propertyark.com (or your support email)
   - **Company Address**: Your company address
4. Click "Create"
5. Check your email inbox for verification link
6. Click the verification link

### Option B: Domain Authentication (Recommended for Production)
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click "Authenticate Your Domain"
3. Select your DNS host (e.g., Cloudflare, GoDaddy, etc.)
4. Enter your domain (e.g., propertyark.com)
5. Follow the instructions to add DNS records
6. Wait for DNS propagation (can take up to 48 hours)

**Benefits of Domain Authentication:**
- ✅ Better email deliverability
- ✅ Emails won't be marked as spam
- ✅ Professional appearance
- ✅ Can send from any email@yourdomain.com

---

## Step 3: Update EMAIL_FROM Variable

After verifying your sender email, update the `EMAIL_FROM` environment variable in Vercel:

**If you verified noreply@propertyark.com:**
```
EMAIL_FROM=PropertyArk <noreply@propertyark.com>
```

**If you're using a different email:**
```
EMAIL_FROM=PropertyArk <your-verified-email@yourdomain.com>
```

---

## Step 4: Test Email Delivery

### Test Forgot Password Flow:
1. Go to your app: https://real-estate-marketplace-delta.vercel.app/auth/forgot-password
2. Enter a registered email address
3. Click "Send reset link"
4. Check your email inbox (and spam folder)

### Check Vercel Logs:
1. Go to https://vercel.com/your-project/deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Find `/api/auth/forgot-password`
5. Look for logs:
   - ✅ `Email sent successfully to user@example.com`
   - ❌ `Failed to send password reset email`

### Check SendGrid Dashboard:
1. Go to https://app.sendgrid.com/email_activity
2. You should see your sent emails
3. Check delivery status:
   - **Delivered**: ✅ Email was delivered successfully
   - **Deferred**: ⏳ Temporary delay, will retry
   - **Bounced**: ❌ Email address invalid or mailbox full
   - **Dropped**: ❌ SendGrid blocked the email (check reason)

---

## Step 5: Improve Email Deliverability

### 1. Avoid Spam Filters

**Update your sender name and email:**
- ✅ Use: `PropertyArk <noreply@propertyark.com>`
- ❌ Avoid: `noreply@gmail.com` or generic emails

**Email content best practices:**
- ✅ Include unsubscribe link (for marketing emails)
- ✅ Use proper HTML structure
- ✅ Include plain text version
- ✅ Avoid spam trigger words (FREE, URGENT, ACT NOW)
- ✅ Include company address in footer

### 2. Set Up SPF, DKIM, and DMARC Records

These DNS records tell email providers that SendGrid is authorized to send emails on your behalf.

**SPF Record:**
```
Type: TXT
Host: @
Value: v=spf1 include:sendgrid.net ~all
```

**DKIM Records:**
- Provided by SendGrid during domain authentication
- Usually 3 CNAME records

**DMARC Record:**
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### 3. Monitor Email Reputation

1. Check SendGrid reputation: https://app.sendgrid.com/statistics
2. Keep bounce rate < 5%
3. Keep spam complaint rate < 0.1%
4. Remove invalid email addresses from your database

---

## Step 6: Handle Email Errors

### Common Issues & Solutions

**Issue: "Email service not configured"**
- **Cause**: SENDGRID_API_KEY not set in Vercel
- **Solution**: Add environment variable and redeploy

**Issue: "Authentication failed"**
- **Cause**: Invalid SendGrid API key
- **Solution**: Generate new API key in SendGrid dashboard

**Issue: "Sender email not verified"**
- **Cause**: EMAIL_FROM address not verified in SendGrid
- **Solution**: Complete sender verification (Step 2)

**Issue: "Emails going to spam"**
- **Cause**: Sender domain not authenticated
- **Solution**: Complete domain authentication (Step 2, Option B)

**Issue: "Emails not delivered"**
- **Cause**: Recipient email invalid or blocked
- **Solution**: Check SendGrid activity log for details

---

## Step 7: Production Checklist

Before going live, ensure:

- [ ] SendGrid API key added to Vercel environment variables
- [ ] EMAIL_FROM variable set with verified sender email
- [ ] FRONTEND_URL variable set to production URL
- [ ] Sender email verified in SendGrid
- [ ] Domain authentication completed (recommended)
- [ ] SPF, DKIM, DMARC records configured
- [ ] Test email delivery to multiple email providers (Gmail, Outlook, Yahoo)
- [ ] Check spam folder and mark as "Not Spam" if needed
- [ ] Monitor SendGrid dashboard for delivery issues
- [ ] Set up email templates for better branding (optional)

---

## Email Template Customization

The password reset email includes:
- ✅ Professional gradient header
- ✅ Clear call-to-action button
- ✅ Clickable reset link
- ✅ Security warnings (1-hour expiry)
- ✅ Instructions for users who didn't request reset
- ✅ Company branding and contact info

To customize the email template, edit: `api/utils/sendEmail.js`

---

## Monitoring & Analytics

### SendGrid Dashboard:
- **Email Activity**: https://app.sendgrid.com/email_activity
- **Statistics**: https://app.sendgrid.com/statistics
- **Alerts**: https://app.sendgrid.com/alerts

### Vercel Logs:
- Check function logs for email sending status
- Look for success/error messages

### Key Metrics to Monitor:
- **Delivery Rate**: Should be > 95%
- **Open Rate**: Typical 15-25% for transactional emails
- **Bounce Rate**: Should be < 5%
- **Spam Complaint Rate**: Should be < 0.1%

---

## Security Best Practices

1. **Never expose SendGrid API key** in client-side code
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** periodically (every 6 months)
4. **Limit API key permissions** to "Mail Send" only
5. **Monitor for suspicious activity** in SendGrid dashboard
6. **Implement rate limiting** on forgot-password endpoint (already done)
7. **Log all email sending attempts** for audit trail

---

## Support & Resources

- **SendGrid Documentation**: https://docs.sendgrid.com
- **SendGrid Support**: https://support.sendgrid.com
- **Email Deliverability Guide**: https://sendgrid.com/resource/email-deliverability-guide
- **DNS Configuration Help**: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication

---

## Next Steps

1. Add environment variables to Vercel (Step 1)
2. Verify sender email in SendGrid (Step 2)
3. Test email delivery (Step 4)
4. Set up domain authentication for production (Step 2, Option B)
5. Monitor email delivery and adjust as needed

Once configured, users will receive professional password reset emails that won't go to spam!

