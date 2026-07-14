# 🔐 Environment Variables Configuration

## Required Environment Variables

### Server Configuration
```env
NODE_ENV=production
PORT=5000
```

### Email Configuration (SendGrid - Currently Configured)

**✅ SendGrid API Key:**
```env
SENDGRID_API_KEY=DiGfmDZ0TF6Y5FozzgW-AQ
EMAIL_FROM=noreply@yourdomain.com
```

**Note:** Replace `noreply@yourdomain.com` with your verified sender email in SendGrid.

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

### Firebase Configuration
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Database (MongoDB)
```env
MONGODB_URI=mongodb://localhost:27017/real-estate-marketplace
```

### Frontend URL
```env
FRONTEND_URL=https://yourdomain.com
```

## Optional Environment Variables

### Support Email
```env
SUPPORT_EMAIL=support@yourdomain.com
```

### Cloudinary (Image Upload)
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Azure Blob + Function (SAS uploads)
```env
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_BLOB_CONTAINER=uploads
AZURE_FUNCTION_URL=https://<your-function-app>.azurewebsites.net/api/generateUploadSas
```

Notes:
- Add `AZURE_FUNCTION_URL` to point backend to the deployed Azure Function (recommended for production).
- Store `AZURE_STORAGE_ACCOUNT_KEY` securely (do not commit it to git).

### Payment Gateways
```env
STRIPE_SECRET_KEY=your-stripe-secret-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
```

## Setup Instructions

### For Local Development

1. Create a `.env` file in the `backend` directory
2. Copy the required variables above
3. Set the SendGrid API key:
   ```env
   SENDGRID_API_KEY=DiGfmDZ0TF6Y5FozzgW-AQ
   ```

### For Production Deployment

#### Render.com
1. Go to your service dashboard
2. Navigate to Environment → Variables
3. Add each variable above

#### Google Cloud Run
1. Go to Cloud Run service
2. Edit and deploy new revision
3. Add environment variables in "Variables & Secrets" section

#### Railway
1. Go to project settings
2. Navigate to Variables tab
3. Add each variable

## Email Service Priority

The email service uses this priority:

1. **SendGrid** (if `SENDGRID_API_KEY` is set) ✅ **Currently configured**
2. Custom SMTP (if `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` are set)
3. Ethereal Email (development/testing only)

## Verification

After setting environment variables, restart your server and check logs:

```
✅ Email service initialized with SendGrid
```

If you see this message, SendGrid is configured correctly!

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to git
- Never expose API keys in client-side code
- Rotate API keys periodically
- Use different keys for development and production

