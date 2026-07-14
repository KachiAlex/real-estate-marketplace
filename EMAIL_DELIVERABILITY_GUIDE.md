# Email Deliverability Guide - Prevent Emails from Spam

This guide covers both **Firebase Auth emails** (password reset) and **SendGrid emails** (other notifications).

## Overview

Emails can go to spam due to:
1. Missing email authentication (SPF, DKIM, DMARC)
2. Poor sender reputation
3. Email content issues
4. Missing unsubscribe links
5. Suspicious links or domains

## Part 1: Firebase Auth Password Reset Emails

Firebase Auth sends password reset emails automatically. To improve deliverability:

### 1. Customize Email Template

**Location:** Firebase Console → Authentication → Templates → Password Reset

**Actions:**
1. **Customize email subject** - Make it clear and trustworthy
   - Good: "Reset your PropertyArk password"
   - Bad: "Click here" or "Urgent action required"

2. **Customize email body** - Add your branding
   - Include your company name
   - Add your logo
   - Professional, clear messaging

3. **Set proper action URL**
   - Should match your deployed domain
   - Use HTTPS only
   - Example: `https://real-estate-marketplace-37544.web.app/reset-password`

### 2. Use Custom Domain (Recommended)

If you have a custom domain:

1. **Configure in Firebase Hosting:**
   - Add custom domain in Firebase Console
   - Update DNS records as instructed

2. **Update email template action URL:**
   - Use your custom domain instead of `.web.app`

### 3. Domain Authentication for Custom Domain

If using a custom domain, configure:

**SPF Record** (DNS):
```
v=spf1 include:_spf.firebase.com ~all
```

**Benefits:**
- Verifies Firebase is authorized to send emails from your domain
- Reduces spam likelihood

## Part 2: SendGrid Backend Emails

For emails sent via your backend (notifications, property updates, etc.):

### 1. Domain Authentication (CRITICAL)

**Location:** SendGrid Dashboard → Settings → Sender Authentication

#### Step 1: Domain Authentication (Recommended)

1. Go to SendGrid → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Choose your domain provider
4. Follow DNS configuration steps

**DNS Records to Add:**

**CNAME Records:**
```
em1234.yourdomain.com → u1234567.wl123.sendgrid.net
s1._domainkey.yourdomain.com → s1.domainkey.u1234567.wl123.sendgrid.net
s2._domainkey.yourdomain.com → s2.domainkey.u1234567.wl123.sendgrid.net
```

**SPF Record:**
```
v=spf1 include:sendgrid.net ~all
```

**Benefits:**
- ✅ Proves you own the domain
- ✅ Significantly improves deliverability
- ✅ Better sender reputation
- ✅ Reduces spam classification

#### Step 2: Single Sender Verification (Quick Start)

If you don't have a custom domain yet:

1. Go to SendGrid → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter sender email and details
4. Verify via email link

**Note:** Domain authentication is better than single sender for production.

### 2. Use Authenticated Sender

**Update Backend Configuration:**

After authenticating domain, use authenticated email:

```env
# In backend/.env or environment variables
EMAIL_FROM=noreply@yourdomain.com  # Use authenticated domain
SENDGRID_API_KEY=your-api-key
```

**Update Email Service:**

The email service should already use `EMAIL_FROM` from environment variables.

### 3. SendGrid IP Warmup (For New IPs)

If SendGrid assigns you a dedicated IP:

1. **Gradually increase sending volume:**
   - Week 1: 50 emails/day
   - Week 2: 500 emails/day
   - Week 3: 5000 emails/day
   - Continue gradually increasing

2. **Monitor reputation:**
   - Check SendGrid dashboard → Activity
   - Monitor bounce rates
   - Watch for spam reports

### 4. Email Content Best Practices

#### ✅ Do's

1. **Use clear sender name:**
   ```
   From: PropertyArk <noreply@propertyark.com>
   ```

2. **Clear subject lines:**
   ```
   ✅ Good: "Property Verification - Action Required"
   ❌ Bad: "URGENT!!! CLICK NOW!!!"
   ```

3. **Professional HTML structure:**
   - Clean, responsive HTML
   - Clear call-to-action buttons
   - Company branding

4. **Include unsubscribe link:**
   - Required for transactional emails
   - Easy to find and use

5. **Plain text version:**
   - Always include plain text alternative
   - Improves deliverability

#### ❌ Don'ts

1. **Avoid spam trigger words:**
   - "Free", "Act now", "Limited time"
   - Excessive exclamation marks!!!
   - ALL CAPS

2. **Don't use URL shorteners:**
   - Use full, clear URLs
   - HTTPS only

3. **Avoid suspicious links:**
   - No bit.ly or tinyurl
   - Clear domain names

4. **Don't send from free email:**
   - Use your own domain
   - No Gmail/Yahoo/Hotmail for production

## Part 3: DNS Configuration

### Complete DNS Setup for Custom Domain

Add these DNS records to your domain:

#### 1. SPF Record (Sender Policy Framework)

**Type:** TXT  
**Name:** @ (or yourdomain.com)  
**Value:**
```
v=spf1 include:sendgrid.net include:_spf.firebase.com ~all
```

**Purpose:** Authorizes SendGrid and Firebase to send emails

#### 2. DKIM Records (DomainKeys Identified Mail)

**For SendGrid:**
- Automatically provided when you authenticate domain
- Add CNAME records as shown in SendGrid dashboard

**For Firebase:**
- Configure if using Firebase Hosting custom domain

#### 3. DMARC Record (Domain-based Message Authentication)

**Type:** TXT  
**Name:** _dmarc  
**Value:**
```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

**Purpose:** Policy for handling failed authentication

**Gradual rollout:**
- Start with `p=none` (monitoring)
- Move to `p=quarantine` (test)
- Finally `p=reject` (production)

#### 4. MX Records (If Needed)

Only if receiving emails on this domain. For sending only, not required.

## Part 4: Email Template Improvements

### Current Email Templates

Update your email templates to include:

1. **Professional HTML structure**
2. **Clear branding**
3. **Unsubscribe link**
4. **Plain text version**
5. **Clear call-to-action**

### Example: Improved Password Reset Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0;">PropertyArk</h1>
    </div>
    
    <h2 style="color: #111827; margin-bottom: 20px;">Reset Your Password</h2>
    
    <p style="color: #374151; line-height: 1.6;">
      You requested a password reset for your PropertyArk account. 
      Click the button below to reset your password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{action_url}}" 
         style="background: #2563eb; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      This link will expire in 1 hour. If you didn't request this, 
      please ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      This email was sent by PropertyArk. 
      If you have questions, contact us at support@propertyark.com
    </p>
  </div>
</body>
</html>
```

## Part 5: Monitoring & Maintenance

### 1. SendGrid Activity Dashboard

Monitor:
- **Delivery rates** (should be >95%)
- **Bounce rates** (should be <2%)
- **Spam reports** (should be <0.1%)
- **Open rates** (indicates engagement)

**Location:** SendGrid Dashboard → Activity

### 2. Firebase Auth Email Logs

Monitor password reset emails:
- Firebase Console → Authentication → Users
- Check for delivery issues
- Review error messages

### 3. Email Reputation Tools

Use these to check your sender reputation:

- **MXToolbox:** https://mxtoolbox.com/blacklists.aspx
- **Sender Score:** https://www.senderscore.org/
- **Google Postmaster Tools:** https://postmaster.google.com/

### 4. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Emails in spam** | No SPF/DKIM | Authenticate domain |
| **Bounce rate high** | Invalid emails | Clean email list |
| **Low open rate** | Poor subject | Improve subject lines |
| **Blocked by Gmail** | Poor reputation | Warmup IP gradually |
| **Firebase emails spam** | No custom domain | Use custom domain + DNS |

## Part 6: Quick Setup Checklist

### For Firebase Auth Emails

- [ ] Customize email template in Firebase Console
- [ ] Set proper action URL (your domain)
- [ ] Use custom domain (if available)
- [ ] Add SPF record for Firebase domain

### For SendGrid Backend Emails

- [ ] Authenticate domain in SendGrid
- [ ] Add SPF record to DNS
- [ ] Add DKIM records to DNS
- [ ] Add DMARC record to DNS
- [ ] Use authenticated sender email
- [ ] Include unsubscribe links
- [ ] Monitor delivery rates
- [ ] Warm up IP (if using dedicated IP)

### Email Content

- [ ] Professional subject lines
- [ ] Clear sender name
- [ ] Clean HTML structure
- [ ] Plain text version included
- [ ] No spam trigger words
- [ ] Clear call-to-action
- [ ] Company branding

## Part 7: Step-by-Step: Domain Authentication in SendGrid

### Option A: Domain Authentication (Best)

1. **Login to SendGrid:**
   - Go to https://app.sendgrid.com/
   - Navigate to Settings → Sender Authentication

2. **Click "Authenticate Your Domain"**

3. **Select DNS Provider:**
   - Choose your domain registrar
   - (e.g., GoDaddy, Namecheap, Cloudflare)

4. **Add DNS Records:**
   - SendGrid will provide CNAME records
   - Add them to your DNS provider
   - Wait for DNS propagation (can take 24-48 hours)

5. **Verify Authentication:**
   - SendGrid will check DNS records
   - Status will show "Verified" when complete

6. **Use Authenticated Domain:**
   - Update `EMAIL_FROM` to use authenticated domain
   - Example: `noreply@yourdomain.com`

### Option B: Single Sender Verification (Quick Start)

1. **Go to SendGrid → Settings → Sender Authentication**
2. **Click "Verify a Single Sender"**
3. **Fill in sender details:**
   - Email address
   - Company name
   - Address
   - Reply-to email

4. **Verify via email:**
   - Check inbox for verification email
   - Click verification link

5. **Use verified sender:**
   - Update `EMAIL_FROM` to verified email

## Part 8: Testing Email Deliverability

### Test 1: Send Test Email

Send to multiple email providers:
- Gmail
- Outlook
- Yahoo
- Apple Mail

Check if emails arrive in inbox or spam.

### Test 2: Check Authentication

Use online tools:
- **MXToolbox SPF Checker:** https://mxtoolbox.com/spf.aspx
- **DKIM Validator:** https://www.dmarcanalyzer.com/dkim/

### Test 3: Monitor SendGrid Stats

Check SendGrid Dashboard:
- Delivery rates
- Bounce rates
- Spam reports

## Quick Wins (Immediate Actions)

1. **✅ Authenticate domain in SendGrid** (biggest impact)
2. **✅ Customize Firebase email template** (better branding)
3. **✅ Add SPF/DKIM/DMARC records** (authentication)
4. **✅ Use professional sender name** (trust)
5. **✅ Improve email content** (less spam-like)

## Priority Actions

### High Priority (Do First)
1. Authenticate domain in SendGrid
2. Add SPF record
3. Customize Firebase email template

### Medium Priority
1. Add DKIM records
2. Add DMARC record
3. Improve email content

### Low Priority (Ongoing)
1. Monitor deliverability metrics
2. Clean email lists
3. Optimize send times

## Resources

- **SendGrid Domain Authentication:** https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- **Firebase Email Templates:** https://firebase.google.com/docs/auth/custom-email-handler
- **SPF Record Generator:** https://www.spf-record.com/
- **DMARC Analyzer:** https://www.dmarcanalyzer.com/

## Need Help?

If emails are still going to spam:
1. Check DNS records are properly configured
2. Verify domain authentication status
3. Monitor SendGrid activity dashboard
4. Test with email deliverability tools
5. Contact SendGrid support if issues persist

---

**Remember:** Domain authentication is the #1 way to improve deliverability. Start there!

