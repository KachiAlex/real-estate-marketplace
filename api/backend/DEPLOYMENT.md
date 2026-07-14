# 🚀 Railway Deployment Guide

## Quick Deploy to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Initialize Railway Project
```bash
railway init
```

### Step 4: Deploy
```bash
railway up
```

### Step 5: Get Your URL
```bash
railway status
```

## Environment Variables Setup

After deployment, set these environment variables in Railway dashboard:

### Required Variables:
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

### Optional Variables (for future features):
```
MONGODB_URI=your-mongodb-connection-string
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@realestate.com
MAX_FILE_SIZE=5242880
```

## Testing Your Deployed API

Once deployed, test these endpoints:

### Health Check
```
GET https://your-app-name.railway.app/api/health
```

### Properties
```
GET https://your-app-name.railway.app/api/properties
```

### Authentication
```
POST https://your-app-name.railway.app/api/auth/register
POST https://your-app-name.railway.app/api/auth/login
```

## Updating Your App

To update your deployed app:
```bash
git add .
git commit -m "Update backend"
railway up
```

## Connecting Frontend

Update your frontend API base URL to point to your Railway deployment:

```javascript
// In your frontend config
const API_BASE_URL = 'https://your-app-name.railway.app/api';
```

## Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in `package.json`
2. **App crashes**: Check logs with `railway logs`
3. **Environment variables**: Ensure all required vars are set in Railway dashboard

### Useful Commands:
```bash
railway logs          # View application logs
railway status        # Check deployment status
railway open          # Open your app in browser
railway variables     # Manage environment variables
```

## Next Steps

1. **Add Database**: Connect MongoDB Atlas or Railway's PostgreSQL
2. **Add Domain**: Configure custom domain in Railway
3. **Add Monitoring**: Set up alerts and monitoring
4. **Scale**: Upgrade plan as needed

Your API will be available at: `https://your-app-name.railway.app` 