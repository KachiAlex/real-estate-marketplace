# Quick Setup: Blog on Firebase (Firestore) in Cloud

## ✅ Current Status

- **Backend**: Deployed on Google Cloud Run (`api-kzs3jdpe7a-uc.a.run.app`)
- **Blog Routes**: Using Firestore (not MongoDB)
- **Service Account Key**: You have the JSON file

## 🚀 Step-by-Step Setup

### Step 1: Convert JSON to Single Line

You have: `real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json`

**Option A: Using PowerShell (Recommended)**
```powershell
# Navigate to where your JSON file is (Downloads folder)
cd C:\Users\user\Downloads

# Copy the JSON file content
$json = Get-Content "real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json" -Raw
$singleLine = $json -replace "`r`n", "" -replace "`n", ""
$singleLine | Set-Content "firebase-key-oneline.txt"
```

**Option B: Online Tool**
1. Open https://www.jsonformatter.org/json-minify
2. Copy your entire JSON file content
3. Paste → Click "Minify"
4. Copy the result

### Step 2: Set Environment Variable on Google Cloud Run

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/run
   - Login: **onyedika.akoma@gmail.com**

2. **Find Your Service**
   - Look for service matching `api-kzs3jdpe7a-uc.a.run.app`
   - Click on it

3. **Edit Service**
   - Click **"EDIT & DEPLOY NEW REVISION"** button

4. **Add Environment Variable**
   - Scroll to **"Variables & Secrets"** section
   - Click **"ADD VARIABLE"**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste your single-line JSON (from Step 1)
   - Click **"SAVE"**

5. **Deploy**
   - Scroll to bottom
   - Click **"DEPLOY"**
   - Wait 2-3 minutes for deployment

### Step 3: Verify It Works

1. **Check Logs**
   - In Cloud Run, go to **"LOGS"** tab
   - You should see: `✅ Firestore initialized`

2. **Test Blog API**
   ```bash
   curl https://api-kzs3jdpe7a-uc.a.run.app/api/blog
   ```
   Should return: `{"success":true,"data":[],...}`

## ✅ Done!

Your blogs are now stored in **Firebase Firestore** in the cloud!

## 📝 Creating Blogs

1. Go to your web app (Firebase Hosting)
2. Login as Admin
3. Navigate to **Admin Panel → Blog Management**
4. Create blogs through the interface
5. Blogs are automatically saved to Firestore ☁️

## ❓ Troubleshooting

**If you see "Firestore initialization failed" in logs:**
- Check JSON format (should be single line, no line breaks)
- Verify environment variable name is exactly: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Make sure the JSON is valid (no extra quotes, proper escaping)

**If blog API returns 404:**
- Make sure you deployed the latest code with Firestore routes
- Check that the service revision has the new environment variable

## 📚 More Details

- Full guide: `backend/CLOUD_DEPLOYMENT_FIRESTORE.md`
- Credentials info: `backend/CREDENTIALS_REQUIRED.md`

