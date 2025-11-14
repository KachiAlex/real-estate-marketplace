# 🚀 Deploy Backend to Google Cloud Run - Step by Step Guide

## What We're Deploying
- ✅ Updated CORS configuration to allow Firebase hosting domains
- ✅ Added `https://real-estate-marketplace-37544.web.app` to allowed origins
- ✅ Added pattern matching for all Firebase hosting domains

## Step-by-Step Instructions

### Step 1: Open Google Cloud Console
1. Go to: **https://console.cloud.google.com/run**
2. Make sure you're logged in with: **onyedika.akoma@gmail.com**
3. Select project: **real-estate-marketplace-37544**

### Step 2: Find Your Service
1. In the Cloud Run services list, look for: **api-kzs3jdpe7a-uc**
2. Click on the service name to open it

### Step 3: Deploy New Revision
1. Click the **"EDIT & DEPLOY NEW REVISION"** button (top of the page)

### Step 4: Configure Deployment

#### If Your Service is Connected to a Git Repository:
1. The code will automatically pull from your repository
2. Make sure you've committed and pushed the changes to your repo first:
   ```bash
   git add backend/config/security.js
   git commit -m "Fix CORS: Allow Firebase hosting domains"
   git push
   ```
3. Cloud Run will automatically detect the new code
4. Click **"DEPLOY"** at the bottom

#### If Your Service is NOT Connected to a Repository:
1. Scroll to **"Container"** section
2. Click **"Continuously deploy new revisions from a source repository"**
3. Click **"SET UP WITH CLOUD BUILD"**
4. Connect your repository (GitHub/GitLab/Bitbucket)
5. Select:
   - **Repository**: Your repository
   - **Branch**: `main` or `master`
   - **Build type**: **Dockerfile**
   - **Dockerfile path**: `backend/Dockerfile`
   - **Docker context**: `backend/`
6. Click **"SAVE"**
7. Then click **"DEPLOY"**

### Step 5: Verify Environment Variables
While in the deployment page, scroll to **"Variables & Secrets"** section and ensure these are set:
- `NODE_ENV=production`
- `PORT=5000`
- `JWT_SECRET` (your secret key)
- `MONGODB_URI` (if using MongoDB)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (if using Firestore)

**Important**: Don't remove any existing environment variables, just verify they're there.

### Step 6: Deploy
1. Scroll to the bottom of the page
2. Click the blue **"DEPLOY"** button
3. Wait 2-3 minutes for the deployment to complete
4. You'll see a success message when done

### Step 7: Verify Deployment
1. After deployment completes, go to the **"LOGS"** tab
2. Look for: `✅ Firestore initialized` (if using Firestore)
3. Look for: `Server running on port 5000`
4. Test the API:
   - Open: https://api-kzs3jdpe7a-uc.a.run.app/api/health
   - Should return: `{"status":"OK","message":"Real Estate API is running",...}`

### Step 8: Test CORS Fix
1. Go to your frontend: https://real-estate-marketplace-37544.web.app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Check if CORS errors are gone
5. The blog section should now load without errors

## Troubleshooting

### If deployment fails:
- Check the **LOGS** tab for error messages
- Verify all environment variables are set correctly
- Make sure the Dockerfile is correct

### If CORS errors persist:
- Clear your browser cache
- Hard refresh the page (Ctrl+Shift+R)
- Check that the deployment completed successfully
- Verify the service URL matches: `api-kzs3jdpe7a-uc.a.run.app`

## What Changed in the Code

**File**: `backend/config/security.js`

**Changes**:
1. Added Firebase hosting URLs to allowed origins
2. Added pattern matching for `.web.app` and `.firebaseapp.com` domains
3. Updated CSP to allow connections to the API

## Next Steps After Deployment

Once deployed successfully:
1. ✅ CORS errors will be resolved
2. ✅ Frontend can fetch blog data from API
3. ✅ All API endpoints will be accessible from Firebase hosting

---

**Need Help?** Check the logs in Cloud Run console for detailed error messages.

