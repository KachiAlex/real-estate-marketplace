# Step-by-Step GitLab Build for PropertyArk APK

## Ready to Build! 

Your GitLab project is now configured with the correct CI/CD pipeline. Follow these steps:

### Step 1: Go to GitLab Project
**Click here**: https://gitlab.com/opd.livmind/propertyark

### Step 2: Create Merge Request for Mobile Build
1. Click **"Merge Requests"** in the left sidebar
2. Click **"New merge request"**
3. Select source branch: `mobile-apk-build`
4. Select target branch: `main`
5. Click **"Compare branches and continue"**
6. Add title: "Build PropertyArk APK with Custom Logo"
7. Click **"Create merge request"**

### Step 3: Create Second Merge Request for CI/CD Fix
1. Click **"New merge request"** again
2. Select source branch: `fix-ci-cd-mobile`
3. Select target branch: `main`
4. Click **"Compare branches and continue"**
5. Add title: "Fix GitLab CI/CD for Mobile Build"
6. Click **"Create merge request"**

### Step 4: Merge Both Requests
1. First merge the "Fix GitLab CI/CD" request
2. Then merge the "Build PropertyArk APK" request
3. Wait for the CI/CD pipeline to start automatically

### Step 5: Monitor the Build
1. Go to **"CI/CD" > "Pipelines"**
2. You should see a new pipeline running
3. Click on the pipeline to watch progress
4. Expected stages:
   - test:frontend (passes quickly)
   - test:backend (passes quickly)
   - build:mobile (takes 15-20 minutes)
   - deploy:mobile-pages (takes 2-3 minutes)

### Step 6: Download Your APK
After the pipeline completes successfully:

**Option A: Direct Download (Easiest)**
1. Wait 5-10 minutes for GitLab Pages to deploy
2. Go to: https://opd.livmind.gitlab.io/propertyark/
3. Click "Download APK" link
4. Save the PropertyArk.apk file

**Option B: Pipeline Artifacts**
1. Go to **"CI/CD" > "Pipelines"**
2. Click on the successful pipeline
3. Click on the **"deploy:mobile-pages"** job
4. Download the APK from job artifacts

## Expected Timeline

- **Merge Requests**: 5 minutes
- **Pipeline Duration**: 20-30 minutes
- **GitLab Pages Deployment**: 5-10 minutes
- **Total Time**: 30-45 minutes

## What You'll Get

### APK Features
- PropertyArk logo as app icon
- 3-second splash screen with logo
- Custom favicon for web
- Android adaptive icons
- Production build (no dev dependencies)
- Package: com.propertyark.mobile

### File Information
- **File Name**: PropertyArk.apk
- **Size**: ~15-25 MB
- **Type**: Android APK
- **Compatibility**: Android 5.0+

## Installation

### Option A: ADB (Developer)
```bash
adb install PropertyArk.apk
```

### Option B: Manual Install
1. Transfer APK to your Android device
2. Enable "Install from unknown sources" in settings
3. Tap on the APK file to install
4. Grant permissions when prompted

## Troubleshooting

### If Pipeline Fails
1. Check the job logs for specific error messages
2. Common issues: Node version, dependencies, Gradle errors
3. Click "Retry" on failed jobs to restart

### If APK Download Fails
1. Wait a few more minutes for GitLab Pages
2. Try refreshing the download page
3. Use pipeline artifacts as backup

### If Installation Fails
1. Ensure "Unknown sources" is enabled
2. Check if you have sufficient storage
3. Try downloading the APK again

## Success Indicators

You'll know it worked when:
- [ ] All pipeline stages show green checkmarks
- [ ] GitLab Pages shows the download page
- [ ] APK downloads successfully
- [ ] APK installs on your device
- [ ] App shows PropertyArk logo
- [ ] Splash screen displays for 3 seconds

## Need Help?

If you encounter issues:
1. Check GitLab CI/CD logs
2. Review this guide
3. The build process is automatic once merged

---

**Ready to start? Go to: https://gitlab.com/opd.livmind/propertyark**

Your PropertyArk mobile app with custom branding is just a few clicks away!
