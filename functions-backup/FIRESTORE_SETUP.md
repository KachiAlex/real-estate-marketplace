# Firebase Admin / Firestore Setup Guide

This guide explains how to set up Firebase Admin SDK credentials for the backend server.

## Getting Firebase Service Account Key

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/real-estate-marketplace-37544
   - Login with: **onyedika.akoma@gmail.com**

2. **Navigate to Project Settings**
   - Click the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"

3. **Go to Service Accounts Tab**
   - Click on the "Service accounts" tab
   - You'll see options for different Firebase SDKs

4. **Generate New Private Key**
   - Click "Generate new private key" button
   - A dialog will appear warning you to keep the key secure
   - Click "Generate key"
   - A JSON file will be downloaded (e.g., `real-estate-marketplace-37544-xxxxx.json`)

5. **Save the Service Account Key**
   - Keep this JSON file secure - it contains sensitive credentials
   - **DO NOT commit this file to git**

## Setting Up Credentials

### Option 1: Environment Variable (Recommended for Production - Render/Cloud Run)

For production deployments, set the service account key as an environment variable:

1. **Convert JSON to Single Line**
   - Open the downloaded JSON file
   - Copy the entire contents
   - Remove all line breaks and extra spaces
   - Result should be a single line JSON string

2. **Set Environment Variable**
   - **For Render**: Go to your service dashboard → Environment → Add environment variable:
     ```
     FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"real-estate-marketplace-37544",...}
     ```
   - **For Google Cloud Run**: Set as environment variable in deployment settings

3. **Alternative: Base64 Encoding**
   If the JSON is too long, you can base64 encode it:
   ```bash
   # Encode
   cat serviceAccountKey.json | base64
   ```
   Then decode in code (you'll need to update `firestore.js` to handle base64)

### Option 2: Service Account File (Local Development)

For local development, you can use the file path:

1. **Save the JSON file** in the backend directory (or a secure location)
2. **Set environment variable:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
   ```
   
   Or create a `.env` file in the `backend` directory:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```

3. **Add to .gitignore**
   Make sure `serviceAccountKey.json` and `.env` are in `.gitignore`:
   ```
   serviceAccountKey.json
   .env
   ```

### Option 3: Project ID Only (Limited Functionality)

If you only need basic Firestore access and are using Firebase emulator or have default credentials configured:

```bash
export FIREBASE_PROJECT_ID="real-estate-marketplace-37544"
```

This is the least secure option and may not work for all operations.

## Verification

After setting up credentials, verify the connection:

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Check console output:**
   You should see:
   ```
   ✅ Firestore initialized
   ```

3. **Test the blog API:**
   ```bash
   curl https://your-backend-url/api/blog
   ```

## Troubleshooting

### Error: "Firestore initialization failed"
- **Check credentials**: Ensure the service account key is valid and properly formatted
- **Check permissions**: The service account needs "Cloud Datastore User" or "Editor" role
- **Check project ID**: Ensure it matches your Firebase project ID

### Error: "Permission denied"
- The service account needs appropriate IAM permissions
- Go to Firebase Console → IAM & Admin → Ensure service account has:
  - `Cloud Datastore User` role (for Firestore)
  - Or `Editor` role for full access

### Error: "Invalid credentials"
- Verify the JSON file is valid JSON (no extra commas, proper quotes)
- If using environment variable, ensure it's a single-line JSON string
- Check for special characters that might need escaping

## Security Best Practices

1. **Never commit service account keys to git**
   - Add `serviceAccountKey.json` to `.gitignore`
   - Add `.env` to `.gitignore`

2. **Use environment variables in production**
   - Never hardcode credentials in code
   - Use secure environment variable management

3. **Rotate keys regularly**
   - Generate new keys periodically
   - Revoke old keys when no longer needed

4. **Limit permissions**
   - Only grant minimum required permissions
   - Use service accounts with specific roles, not owner/admin

5. **Monitor usage**
   - Check Firebase Console for unexpected activity
   - Set up alerts for unusual access patterns

## For Render Deployment

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" section
4. Add new environment variable:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the single-line JSON (entire contents of the service account file)
5. Save and redeploy your service

## For Google Cloud Run Deployment

1. In Cloud Run console, go to your service
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add environment variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: The JSON string
5. Deploy the new revision

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Check backend server logs
3. Verify service account permissions in Firebase Console
4. Ensure project ID matches: `real-estate-marketplace-37544`

