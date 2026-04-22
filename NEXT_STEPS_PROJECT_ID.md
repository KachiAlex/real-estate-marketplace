# Next Steps: Get EAS Project ID and Build APK

## Current Status

✅ Logged in to Expo  
✅ Mobile app configured  
❌ EAS Project ID needed  

## What You Need to Do

### Step 1: Create EAS Project (Web Dashboard)

**Go to**: https://expo.dev/projects

**Create new project:**
1. Click "Create a new project"
2. Enter name: `PropertyArk Mobile`
3. Slug: `propertyark-mobile` (auto-filled)
4. Click "Create"

**Copy Project ID:**
- You'll see a UUID like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Copy this entire ID

### Step 2: Update app.json with Project ID

**Option A: Use PowerShell Script (Easiest)**

```powershell
cd D:\real-estate-marketplace\mobile
.\UPDATE_PROJECT_ID.ps1
```

The script will:
1. Ask for your Project ID
2. Validate the format
3. Update `app.json`
4. Confirm the update

**Option B: Manual Update**

Edit `mobile/app.json` and replace:

```json
"extra": {
  "eas": {
    "projectId": "12345678-1234-5678-1234-567812345678"
  }
}
```

With your actual Project ID:

```json
"extra": {
  "eas": {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

### Step 3: Build Android APK

Once `app.json` is updated:

```powershell
cd D:\real-estate-marketplace\mobile
npx eas build --platform android --profile preview
```

**What will happen:**
1. Build starts on EAS servers
2. Takes 5-10 minutes
3. Shows progress in terminal
4. Provides download link when complete

### Step 4: Download APK

When build completes:
```
✅ Build completed successfully
Download: https://expo.dev/artifacts/eas/...
```

Click the link to download the APK file (~50-80 MB)

### Step 5: Install on Android Device

1. Transfer APK to Android device
2. Open file manager
3. Tap APK to install
4. If prompted, enable "Unknown Sources"
5. Launch app and test

---

## Quick Reference

### Project ID Format

A UUID looks like:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Format**: 8-4-4-4-12 hexadecimal digits separated by hyphens

### Files to Use

- **GET_PROJECT_ID.md** - Detailed instructions for getting Project ID
- **UPDATE_PROJECT_ID.ps1** - Script to update app.json
- **app.json** - File that needs the Project ID

### Commands

```powershell
# Update Project ID (interactive)
.\UPDATE_PROJECT_ID.ps1

# Build APK
npx eas build --platform android --profile preview

# Check build status
npx eas build:list

# View build logs
npx eas build:view <BUILD_ID>
```

---

## Timeline

1. **Create Project**: 2-3 minutes (web dashboard)
2. **Update app.json**: 1 minute (script or manual)
3. **Build APK**: 5-10 minutes (EAS servers)
4. **Download**: 1-2 minutes (depending on internet)
5. **Install**: 2-3 minutes (on device)

**Total**: ~15-20 minutes

---

## Troubleshooting

### "Invalid UUID appId"
- Project ID format is wrong
- Make sure it's a UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Get a new one from Expo dashboard

### "Project not found"
- Project ID doesn't exist
- Create a new project in Expo dashboard
- Copy the new ID

### Build fails
- Check internet connection
- Verify Project ID is correct
- Try again: `npx eas build --platform android --profile preview`

---

## Support

- **Expo Dashboard**: https://expo.dev/projects
- **EAS Documentation**: https://docs.expo.dev/build/
- **Get Project ID**: See `mobile/GET_PROJECT_ID.md`

---

## Summary

1. ✅ Go to https://expo.dev/projects
2. ✅ Create project "PropertyArk Mobile"
3. ✅ Copy Project ID
4. ✅ Run `.\UPDATE_PROJECT_ID.ps1` (or update manually)
5. ✅ Run `npx eas build --platform android --profile preview`
6. ✅ Download APK when build completes
7. ✅ Install on Android device

---

**Status**: Ready for Project ID  
**Next Action**: Visit Expo dashboard and create project