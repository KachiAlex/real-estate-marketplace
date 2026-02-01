# 📧 SendGrid Email Setup Guide

## Quick Setup

SendGrid API key has been configured. Follow these steps to activate email notifications:

### 1. Set Environment Variable

#### For Local Development:

Create a `.env` file in the `backend` directory:

```env
SENDGRID_API_KEY=DiGfmDZ0TF6Y5FozzgW-AQ
EMAIL_FROM=noreply@yourdomain.com
NODE_ENV=production
```

#### For Production Deployment:

**Render/Google Cloud Run:**
- Add environment variable: `SENDGRID_API_KEY`
- Value: `DiGfmDZ0TF6Y5FozzgW-AQ`

**Railway/Heroku:**
- Go to Settings → Environment Variables
- Add: `SENDGRID_API_KEY=DiGfmDZ0TF6Y5FozzgW-AQ`

### 2. Verify Configuration

The email service will automatically detect SendGrid if `SENDGRID_API_KEY` is set.

You should see this log on server start:
```
✅ Email service initialized with SendGrid
```

### 3. Test Email Sending

You can test email functionality through the API or by checking logs when emails are sent.

## Email Service Priority

The email service uses this priority order:

1. **SendGrid** (if `SENDGRID_API_KEY` is set) ← Currently configured ✅
2. **Custom SMTP** (if `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` are set)
3. **Ethereal Email** (development/testing only, if nothing else is configured)

## SendGrid Features

- ✅ Transactional emails (property verification, escrow notifications)
- ✅ Template emails (using notification templates)
- ✅ Bulk emails
- ✅ Reliable delivery
- ✅ Email analytics and tracking

## Current Configuration

- **API Key**: Configured ✅
- **SMTP Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Security**: TLS (not SSL)

## Email Types Supported

1. **Property Verification**
   - Property approved/rejected notifications
   
2. **Escrow Notifications**
   - Escrow created
   - Escrow disputed
   - Escrow resolved

3. **User Status**
   - Account suspended
   - Account activated

4. **Investment Notifications**
   - Investment updates
   - Investment confirmations

5. **System Maintenance**
   - Scheduled maintenance announcements

## Troubleshooting

### Email not sending?

1. **Check environment variable:**
   ```bash
   echo $SENDGRID_API_KEY  # Should output your API key
   ```

2. **Check server logs:**
   - Look for: `✅ Email service initialized with SendGrid`
   - If you see warnings, check your configuration

3. **Verify SendGrid API key:**
   - Go to SendGrid dashboard
   - Check API keys section
   - Ensure the key has "Mail Send" permissions

4. **Check FROM address:**
   - Ensure `EMAIL_FROM` is a verified sender in SendGrid
   - Unverified senders may be blocked

### Common Issues

**"Email transporter not initialized"**
- Solution: Check that `SENDGRID_API_KEY` is set in environment variables

**"Authentication failed"**
- Solution: Verify API key is correct and has proper permissions

**"Email not delivered"**
- Solution: Verify sender email (`EMAIL_FROM`) in SendGrid dashboard

## Next Steps

1. ✅ SendGrid API key is configured
2. Set `EMAIL_FROM` to your verified sender email
3. Test email sending with a property verification or notification
4. Monitor SendGrid dashboard for delivery statistics

## Security Note

⚠️ **Never commit API keys to git!**

The `.env` file is already in `.gitignore`. Always use environment variables for sensitive credentials.

