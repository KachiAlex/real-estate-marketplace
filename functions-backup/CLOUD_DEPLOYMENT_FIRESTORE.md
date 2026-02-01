# Deploying Blog with Firebase (Firestore) on Google Cloud Run

## Current Setup

✅ **Backend API**: `https://api-kzs3jdpe7a-uc.a.run.app` (Google Cloud Run)
✅ **Blog Routes**: Already migrated to use Firestore
✅ **Service Account Key**: You have the JSON file

## Step 1: Convert Service Account Key to Single-Line JSON

Since you have the file: `real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json`

### Option A: Using PowerShell (Windows)

```powershell
# Read the JSON file and convert to single line
$json = Get-Content "C:\Users\user\Downloads\real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json" -Raw
$jsonSingleLine = $json -replace "`r`n", "" -replace " ", ""
$jsonSingleLine | Set-Content "firebase-key-single-line.txt"
```

### Option B: Manual Method

1. Open the JSON file in a text editor
2. Copy the entire content
3. Remove all line breaks (make it one continuous line)
4. Save it somewhere safe (you'll paste this into Cloud Run)

### Option C: Online Tool

Use a JSON minifier:
- https://www.jsonformatter.org/json-minify
- Paste your JSON → Minify → Copy the result

## Step 2: Set Environment Variable on Google Cloud Run

### Method 1: Using Google Cloud Console (Web UI)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Login with: **onyedika.akoma@gmail.com**

2. **Navigate to Cloud Run**
   - Go to "Cloud Run" in the left menu
   - Find your service (looks like `api` or `real-estate-backend`)

3. **Edit the Service**
   - Click on your service name
   - Click "EDIT & DEPLOY NEW REVISION"

4. **Add Environment Variable**
   - Scroll down to "Variables & Secrets" section
   - Click "ADD VARIABLE"
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the single-line JSON (from Step 1)
   - Click "SAVE"

5. **Deploy**
   - Scroll to bottom
   - Click "DEPLOY"
   - Wait for deployment to complete

### Method 2: Using gcloud CLI

```bash
# Install gcloud CLI if not installed
# https://cloud.google.com/sdk/docs/install

# Set the service account key as environment variable
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT_KEY=$(cat real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json | jq -c .)" \
  --region=us-central1
```

## Step 3: Verify the Deployment

### Test Firestore Connection

1. **Check Logs**
   - In Cloud Run console, go to "LOGS" tab
   - Look for: `✅ Firestore initialized`
   - If you see this, Firestore is working!

2. **Test Blog API**
   ```bash
   curl https://api-kzs3jdpe7a-uc.a.run.app/api/blog
   ```

   Should return:
   ```json
   {
     "success": true,
     "data": [],
     "pagination": {
       "currentPage": 1,
       "totalPages": 0,
       "totalItems": 0,
       "itemsPerPage": 10
     }
   }
   ```

3. **Check for Errors**
   - If you see `❌ Firestore initialization failed` in logs
   - The JSON might not be properly formatted (check for escaping)
   - Verify the environment variable is set correctly

## Step 4: Create Blogs Through Web Interface

Once deployed:

1. **Go to your web app** (deployed on Firebase Hosting)
2. **Login as Admin**
3. **Navigate to Admin Panel → Blog Management**
4. **Create blogs** through the web interface
5. **Blogs are saved to Firestore** automatically

## Important Notes

### Security
- ✅ Environment variables in Cloud Run are encrypted
- ✅ Service account key is never exposed in code
- ✅ Never commit the JSON file to git (already in .gitignore)

### Troubleshooting

**Problem**: `Firestore initialization failed`
- **Solution**: Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- **Check**: Environment variable format (should be single-line JSON)
- **Verify**: JSON is valid (no extra quotes or escaped characters)

**Problem**: `Permission denied`
- **Solution**: Service account needs "Cloud Datastore User" role
- **Fix**: Go to Firebase Console → IAM & Admin → Add role

**Problem**: Blog API returns 404
- **Solution**: Ensure the backend routes are deployed with the latest code
- **Check**: Git push completed and Cloud Run redeployed

## Current Status

- ✅ Blog routes use Firestore (not MongoDB)
- ✅ Backend deployed on Cloud Run
- ⚠️ Need to set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- ⚠️ Need to redeploy after setting environment variable

## Quick Command Reference

```bash
# View current environment variables
gcloud run services describe YOUR_SERVICE_NAME --region=us-central1 --format="value(spec.template.spec.containers[0].env)"

# Update environment variable
gcloud run services update YOUR_SERVICE_NAME \
  --update-env-vars="FIREBASE_SERVICE_ACCOUNT_KEY=<single-line-json>" \
  --region=us-central1

# View logs
gcloud run services logs read YOUR_SERVICE_NAME --region=us-central1
```

## Summary

1. **Convert JSON to single line** (use PowerShell or online tool)
2. **Set `FIREBASE_SERVICE_ACCOUNT_KEY`** in Cloud Run environment variables
3. **Redeploy the service**
4. **Verify** with API test or check logs
5. **Create blogs** through web interface

Once done, your blogs will be stored in Firebase Firestore in the cloud! 🎉

