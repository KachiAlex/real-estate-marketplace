# Exact Firebase Admin Credentials Required

## What You Need

A **Firebase Service Account Key** (JSON file) downloaded from Firebase Console.

## Where to Get It

1. **Go to Firebase Console**
   - URL: https://console.firebase.google.com/project/real-estate-marketplace-37544
   - Login with: **onyedika.akoma@gmail.com**

2. **Navigate to Project Settings**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Click "Project settings"

3. **Go to Service Accounts Tab**
   - Click the "Service accounts" tab
   - You'll see Firebase Admin SDK options

4. **Generate New Private Key**
   - Click the "Generate new private key" button
   - A warning dialog will appear (this is normal)
   - Click "Generate key"
   - A JSON file will be downloaded (e.g., `real-estate-marketplace-37544-xxxxx.json`)

## What the JSON File Contains

The downloaded JSON file will look like this:

```json
{
  "type": "service_account",
  "project_id": "real-estate-marketplace-37544",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@real-estate-marketplace-37544.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40real-estate-marketplace-37544.iam.gserviceaccount.com"
}
```

**Key Fields:**
- `type`: Always "service_account"
- `project_id`: Your Firebase project ID (should be "real-estate-marketplace-37544")
- `private_key`: The private key for authentication (starts with "-----BEGIN PRIVATE KEY-----")
- `client_email`: Service account email
- `client_id`: Service account ID

## How to Use It

You have **2 options** for providing these credentials:

### Option 1: Environment Variable (Recommended for Production)

**What to do:**
1. Open the downloaded JSON file
2. Copy the **entire content** (all of it, from `{` to `}`)
3. Remove all line breaks and extra spaces
4. Convert it to a **single-line JSON string**

**Example format:**
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"real-estate-marketplace-37544","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@real-estate-marketplace-37544.iam.gserviceaccount.com","client_id":"123456789",...}
```

**Where to set it:**
- **For Render**: Dashboard → Your Service → Environment → Add Variable
  - Key: `FIREBASE_SERVICE_ACCOUNT_KEY`
  - Value: The single-line JSON string
- **For Google Cloud Run**: Deployment → Environment Variables → Add Variable
  - Key: `FIREBASE_SERVICE_ACCOUNT_KEY`
  - Value: The single-line JSON string
- **For Local Development**: Create `backend/.env` file:
  ```
  FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
  ```

### Option 2: Service Account File (For Local Development)

**What to do:**
1. Save the downloaded JSON file as: `backend/serviceAccountKey.json`
2. Keep it in the `backend` directory

**Where to set it:**
- **For Local Development**: Create `backend/.env` file:
  ```
  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
  ```
  
**Important:** The file path should be relative to where the server runs (from `backend` directory)

## Quick Setup Script

Once you have the JSON file:

1. **For Local Development:**
   ```bash
   cd backend
   # Copy your downloaded JSON file here
   cp ~/Downloads/real-estate-marketplace-37544-xxxxx.json ./serviceAccountKey.json
   
   # Create .env file
   echo "GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json" > .env
   ```

2. **For Production (Render/Cloud Run):**
   - Convert JSON to single line (remove line breaks)
   - Set as environment variable `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Use an online tool or this command:
     ```bash
     cat serviceAccountKey.json | tr -d '\n' | tr -d ' '
     ```

## Testing the Setup

After setting up credentials, test it:

```bash
cd backend
npm run setup:firebase
```

This will show you:
- ✅ If credentials are properly configured
- ❌ If there are any issues
- 📚 Instructions if something is missing

Then start your server:
```bash
npm start
```

You should see:
```
✅ Firestore initialized
```

## Important Security Notes

1. **NEVER commit the JSON file to git**
   - It's already in `.gitignore`
   - Contains sensitive credentials

2. **Keep the JSON file secure**
   - Don't share it publicly
   - Don't send it via insecure channels

3. **If credentials are leaked:**
   - Go back to Firebase Console
   - Delete the service account
   - Generate a new one

## Summary

**What you need:** Firebase Service Account JSON file from Firebase Console

**How to get it:** 
- Firebase Console → Project Settings → Service Accounts → Generate new private key

**How to use it:**
- **Option A**: Convert to single-line JSON, set as `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- **Option B**: Save as `backend/serviceAccountKey.json`, set `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json` in `.env`

**Test it:** Run `npm run setup:firebase` in the backend directory

