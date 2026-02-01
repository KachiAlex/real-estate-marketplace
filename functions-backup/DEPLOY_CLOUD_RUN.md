# Deploy Backend to Google Cloud Run

## Quick Deploy via Cloud Console

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/run
2. Login with your Google account (onyedika.akoma@gmail.com)
3. Select project: `real-estate-marketplace-37544`

### Step 2: Find Your Service
1. Look for service: `api-kzs3jdpe7a-uc` (or similar)
2. Click on the service name

### Step 3: Deploy New Revision
1. Click **"EDIT & DEPLOY NEW REVISION"** button
2. Scroll down to **"Container"** section
3. Choose one of these methods:

#### Method A: Deploy from Source (Recommended)
1. Click **"Continuously deploy new revisions from a source repository"**
2. Connect your repository (GitHub/GitLab/Bitbucket)
3. Select branch: `main` or `master`
4. Set build type: **Dockerfile**
5. Dockerfile path: `backend/Dockerfile`
6. Click **"DEPLOY"**

#### Method B: Deploy from Container Image
1. If you have a container registry, use that
2. Or build locally and push to Google Container Registry

#### Method C: Upload Code Directly
1. Click **"Upload a container image"** or **"Deploy one revision from an existing container image"**
2. For source-based: Use **"Cloud Build"** to build from source

### Step 4: Verify Environment Variables
Make sure these are set in **"Variables & Secrets"**:
- `NODE_ENV=production`
- `PORT=5000`
- `JWT_SECRET` (your secret key)
- `MONGODB_URI` (if using MongoDB)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (if using Firestore)

### Step 5: Deploy
1. Scroll to bottom
2. Click **"DEPLOY"**
3. Wait 2-3 minutes for deployment

### Step 6: Verify
1. Check logs in Cloud Run console
2. Test API: `https://api-kzs3jdpe7a-uc.a.run.app/api/health`
3. Should return: `{"status":"OK",...}`

## Alternative: Install gcloud CLI and Deploy

### Install gcloud CLI
```powershell
# Using winget (Windows)
winget install Google.CloudSDK

# Or download from:
# https://cloud.google.com/sdk/docs/install
```

### Then run:
```powershell
.\deploy-backend.ps1
```

## What Changed
- ✅ Updated CORS to allow Firebase hosting domains
- ✅ Added `https://real-estate-marketplace-37544.web.app` to allowed origins
- ✅ Added pattern matching for all `.web.app` and `.firebaseapp.com` domains

## After Deployment
The CORS errors should be resolved and your frontend can now fetch data from the API!

