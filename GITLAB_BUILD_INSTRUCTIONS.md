# GitLab CI/CD Build Instructions for PropertyArk APK

## Step-by-Step Guide

### Step 1: Go to GitLab Project
**URL**: https://gitlab.com/opd.livmind/propertyark

### Step 2: Create Merge Request
1. Click on **"Merge Requests"** in the left sidebar
2. Click **"New merge request"**
3. Select source branch: `mobile-apk-build`
4. Select target branch: `main`
5. Click **"Compare branches and continue"**

### Step 3: Review and Merge
1. Review the changes in the merge request
2. Add a title: "Build PropertyArk APK with Custom Logo"
3. Add a description: "Configure mobile app with branding and build scripts"
4. Click **"Create merge request"**
5. Click **"Merge"** to merge into main branch

### Step 4: Monitor CI/CD Pipeline
1. After merging, go to **"CI/CD" > "Pipelines"**
2. You should see a new pipeline running
3. Click on the pipeline to view progress
4. Monitor the build stages:
   - test:frontend
   - test:backend  
   - build:mobile
   - deploy:mobile-pages

### Step 5: Download APK
Once the pipeline completes successfully:

#### Option A: GitLab Pages (Easiest)
- **URL**: https://opd.livmind.gitlab.io/propertyark/
- **Direct APK**: https://opd.livmind.gitlab.io/propertyark/mobile/PropertyArk.apk
- Click the link to download the APK

#### Option B: Pipeline Artifacts
1. Go to **"CI/CD" > "Pipelines"**
2. Click on the completed pipeline
3. Click on the **"deploy:mobile-pages"** job
4. Download the APK from the artifacts

## Expected Timeline

- **Merge Request Creation**: 2-3 minutes
- **Pipeline Start**: Immediate after merge
- **Build Duration**: 15-30 minutes
- **APK Available**: 30-45 minutes total

## What to Expect

### Build Stages
1. **Test Stage**: Runs unit tests
2. **Build Stage**: Compiles the mobile app
3. **Deploy Stage**: Creates GitLab Pages with APK

### Success Indicators
- All pipeline stages show green checkmarks
- APK appears in GitLab Pages
- Download link works

### Troubleshooting

#### If Pipeline Fails
1. Check the job logs for error messages
2. Common issues: Node version, dependencies, permissions
3. Retry the pipeline by clicking "Retry" on failed jobs

#### If APK Not Available
1. Wait a few minutes for GitLab Pages to deploy
2. Check if the deploy:mobile-pages job succeeded
3. Try refreshing the GitLab Pages URL

## APK Features

Once built, your APK will include:
- PropertyArk logo as app icon
- 3-second splash screen with logo
- Custom favicon for web version
- Android adaptive icons
- Production build (no dev dependencies)
- Package: com.propertyark.mobile

## Installation

After downloading:
```bash
# Install via ADB
adb install PropertyArk.apk

# Or transfer to device and install manually
```

## Support

If you encounter issues:
1. Check GitLab CI/CD logs
2. Review this guide
3. Contact GitLab support if needed

---

**Ready to start? Go to: https://gitlab.com/opd.livmind/propertyark**
