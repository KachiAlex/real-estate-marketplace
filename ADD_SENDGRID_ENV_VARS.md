# Add SendGrid Environment Variables to Cloud Run

## Problem
The Cloud Run service `api` is currently failing because it's trying to use a container image that doesn't exist. We need to:
1. Fix the deployment configuration
2. Add SendGrid environment variables

## Solution: Use Cloud Console (Recommended)

### Step 1: Go to Cloud Run Console
1. Open: https://console.cloud.google.com/run?project=real-estate-marketplace-37544
2. Make sure you're logged in as: **onyedika.akoma@gmail.com**
3. Select project: **real-estate-marketplace-37544**

### Step 2: Select the Service
1. Click on the service named **`api`**
2. You should see the service details page

### Step 3: Edit Service Configuration
1. Click the **"EDIT & DEPLOY NEW REVISION"** button (top of the page)

### Step 4: Fix Container Configuration
The service is currently trying to use a non-existent image. You need to configure it to build from source:

1. Scroll to the **"Container"** section
2. Look for **"Container image URL"** or **"Deploy from source"**
3. Choose one of these options:

#### Option A: Deploy from Source Repository (Recommended)
1. Click **"Continuously deploy new revisions from a source repository"**
2. If not connected:
   - Click **"SET UP WITH CLOUD BUILD"**
   - Connect your GitHub/GitLab repository
   - Select:
     - **Repository**: Your repo
     - **Branch**: `main` or `master`
     - **Build type**: **Dockerfile**
     - **Dockerfile path**: `backend/Dockerfile`
     - **Docker context**: `backend/`
3. Click **"SAVE"**

#### Option B: Deploy from Local Source (If you have gcloud CLI)
Run this command from your project root:
```powershell
gcloud run deploy api `
    --source ./backend `
    --region us-central1 `
    --allow-unauthenticated `
    --port 5000 `
    --clear-base-image `
    --set-env-vars SENDGRID_API_KEY=DiGfmDZ0TF6Y5FozzgW-AQ,EMAIL_FROM="PropertyArk Security <no-reply@propertyark.com>",NODE_ENV=production `
    --project=real-estate-marketplace-37544
```

### Step 5: Add Environment Variables
While in the "EDIT & DEPLOY NEW REVISION" page:

1. Scroll to **"Variables & Secrets"** section
2. Click **"ADD VARIABLE"** for each:

   **Variable 1:**
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: `DiGfmDZ0TF6Y5FozzgW-AQ`
   - Click **"SAVE"**

   **Variable 2:**
   - **Name**: `EMAIL_FROM`
   - **Value**: `PropertyArk Security <no-reply@propertyark.com>`
   - Click **"SAVE"**

   **Variable 3 (if not already set):**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - Click **"SAVE"**

### Step 6: Deploy
1. Scroll to the bottom of the page
2. Click **"DEPLOY"**
3. Wait 2-3 minutes for the deployment to complete

### Step 7: Verify
1. After deployment completes, check the **"LOGS"** tab
2. You should see: `✅ Email service initialized with SendGrid`
3. Test the forgot password flow:
   - Go to your app: https://real-estate-marketplace-37544.web.app
   - Click "Sign In" → "Forgot your password?"
   - Enter an email address
   - Check the email inbox (and spam folder initially)

## Alternative: Quick Fix via gcloud CLI

If you prefer using the command line, try this approach:

```powershell
# First, check current service configuration
gcloud run services describe api --region us-central1 --project=real-estate-marketplace-37544 --format=yaml

# Then update environment variables (this will create a new revision)
gcloud run services update api `
    --region us-central1 `
    --update-env-vars SENDGRID_API_KEY=DiGfmDZ0TF6Y5FozzgW-AQ,EMAIL_FROM="PropertyArk Security <no-reply@propertyark.com>" `
    --project=real-estate-marketplace-37544
```

However, this might still fail if the container image is missing. In that case, you'll need to fix the container configuration first (Step 4 above).

## Troubleshooting

### If deployment still fails:
1. Check the **"LOGS"** tab in Cloud Run console for detailed error messages
2. Verify the Dockerfile exists at `backend/Dockerfile`
3. Make sure your repository is connected and accessible
4. Check Cloud Build logs: https://console.cloud.google.com/cloud-build/builds

### If emails still don't send:
1. Verify environment variables are set:
   ```powershell
   gcloud run services describe api --region us-central1 --format="value(spec.template.spec.containers[0].env)"
   ```
2. Check backend logs for email service initialization messages
3. Verify SendGrid API key is correct and active
4. Check SendGrid dashboard for email activity: https://app.sendgrid.com

## Next Steps After Successful Deployment

1. **Test forgot password flow** end-to-end
2. **Monitor email delivery** in SendGrid dashboard
3. **Check spam folder** initially - mark as "Not Spam" if needed
4. **Verify sender domain** in SendGrid (optional but recommended for better deliverability)

