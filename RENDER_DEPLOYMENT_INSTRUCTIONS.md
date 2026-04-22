# 🚀 Render Deployment Instructions

## Method 1: Manual Deployment (No Git Required)

### Step 1: Prepare Your Files
1. **Zip your backend folder**:
   - Right-click on the `backend` folder
   - Select "Send to" → "Compressed (zipped) folder"
   - Name it `real-estate-backend.zip`

### Step 2: Deploy on Render

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with your email
3. **Click "New +"** → **"Web Service"**
4. **Choose "Deploy from existing code"**
5. **Upload your zip file** (`real-estate-backend.zip`)
6. **Configure the service:**

   - **Name**: `real-estate-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

7. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: `your-super-secret-jwt-key-change-this-in-production`
   - `JWT_EXPIRE`: `30d`

8. **Click "Create Web Service"**

### Step 3: Get Your URL

After deployment, Render will give you a URL like:
`https://real-estate-backend.onrender.com`

## Method 2: GitHub Deployment (Recommended)

### Step 1: Install Git
```bash
winget install --id Git.Git -e --source winget
```

### Step 2: Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit with backend"
```

### Step 3: Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it `real-estate-marketplace`
4. Don't initialize with README
5. Click "Create repository"

### Step 4: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/real-estate-marketplace.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure as above

## Testing Your Deployed API

### Health Check
```
GET https://your-app-name.onrender.com/api/health
```

### Properties
```
GET https://your-app-name.onrender.com/api/properties
```

### Authentication
```
POST https://your-app-name.onrender.com/api/auth/register
POST https://your-app-name.onrender.com/api/auth/login
```

## Environment Variables

Set these in Render dashboard:

### Required:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `JWT_SECRET`: `your-super-secret-jwt-key-change-this-in-production`
- `JWT_EXPIRE`: `30d`

## Benefits of Render

- ✅ **Free tier available**
- ✅ **Automatic HTTPS**
- ✅ **Auto-deploy from Git**
- ✅ **Custom domains**
- ✅ **Easy environment variables**
- ✅ **Good documentation**

Your API will be available at: `https://your-app-name.onrender.com` 