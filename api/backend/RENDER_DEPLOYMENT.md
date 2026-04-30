# 🚀 Render Deployment Guide

## Quick Deploy to Render

### Step 1: Push to GitHub
First, make sure your code is on GitHub:

```bash
git add .
git commit -m "Add backend for deployment"
git push origin main
```

### Step 2: Deploy on Render

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New +"** → **"Web Service"**
4. **Connect your GitHub repository**
5. **Configure the service:**

   - **Name**: `real-estate-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

6. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: `your-super-secret-jwt-key-change-this-in-production`
   - `JWT_EXPIRE`: `30d`

7. **Click "Create Web Service"**

### Step 3: Get Your URL

After deployment, Render will give you a URL like:
`https://real-estate-backend.onrender.com`

## Testing Your Deployed API

### Health Check
```
GET https://real-estate-backend.onrender.com/api/health
```

### Properties
```
GET https://real-estate-backend.onrender.com/api/properties
```

### Authentication
```
POST https://real-estate-backend.onrender.com/api/auth/register
POST https://real-estate-backend.onrender.com/api/auth/login
```

## Environment Variables

Set these in Render dashboard:

### Required:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `JWT_SECRET`: `your-super-secret-jwt-key-change-this-in-production`
- `JWT_EXPIRE`: `30d`

### Optional (for future features):
- `MONGODB_URI`: `your-mongodb-connection-string`
- `CLOUDINARY_CLOUD_NAME`: `your-cloud-name`
- `CLOUDINARY_API_KEY`: `your-api-key`
- `CLOUDINARY_API_SECRET`: `your-api-secret`
- `STRIPE_SECRET_KEY`: `your-stripe-secret-key`
- `STRIPE_PUBLISHABLE_KEY`: `your-stripe-publishable-key`
- `SENDGRID_API_KEY`: `your-sendgrid-api-key`
- `EMAIL_FROM`: `noreply@realestate.com`
- `MAX_FILE_SIZE`: `5242880`

## Connecting Frontend

Update your frontend API base URL:

```javascript
// In your frontend config
const API_BASE_URL = 'https://real-estate-backend.onrender.com/api';
```

## Auto-Deploy

Render will automatically deploy when you push to your GitHub repository.

## Benefits of Render

- ✅ **Free tier available**
- ✅ **Automatic HTTPS**
- ✅ **Auto-deploy from Git**
- ✅ **Custom domains**
- ✅ **Easy environment variables**
- ✅ **Good documentation**

Your API will be available at: `https://real-estate-backend.onrender.com` 