# EAS Project Setup Guide

## Current Status

✅ Logged in to Expo as: **kachianietie**  
❌ EAS Project: Not yet created (need valid Project ID)

## Why We Need an EAS Project

The build failed because the Project ID in `app.json` is not valid. We need to create a real EAS project to get a valid UUID.

## Two Options to Create EAS Project

### Option 1: Web Dashboard (Easiest) ⭐ RECOMMENDED

**Step 1: Go to Expo Dashboard**
- Visit: https://expo.dev/projects
- You should be logged in as kachianietie

**Step 2: Create New Project**
- Click "Create a new project"
- Enter name: `PropertyArk Mobile`
- Click "Create"

**Step 3: Copy Project ID**
- You'll see a Project ID (UUID format)
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Step 4: Update app.json**
Open `mobile/app.json` and update:
```json
"extra": {
  "eas": {
    "projectId": "YOUR_PROJECT_ID_HERE"
  }
}
```

Replace `YOUR_PROJECT_ID_HERE` with your actual Project ID.

**Step 5: Build APK**
```powershell
cd D:\real-estate-marketplace\mobile
npx eas build --platform android --profile preview
```

---

### Option 2: CLI with Force Flag

If you want to use the command line:

```powershell
cd D:\real-estate-marketplace\mobile
npx eas init --force
```

This will:
- Create a new EAS project
- Generate a valid Project ID
- Automatically update `app.json`

---

## Detailed Web Dashboard Steps

### Step 1: Open Expo Dashboard
```
https://expo.dev/projects
```

### Step 2: Create Project
1. Click "Create a new project" button
2. Fill in:
   - **Project Name**: PropertyArk Mobile
   - **Slug**: propertyark-mobile (auto-filled)
3. Click "Create"

### Step 3: View Project Details
After creation, you'll see:
- Project name: PropertyArk Mobile
- Project ID: (long UUID)
- Project slug: propertyark-mobile

### Step 4: Copy Project ID
- Look for "Project ID" field
- Copy the entire UUID
- Example format: `12345678-1234-5678-1234-567812345678`

### Step 5: Update app.json
Edit `mobile/app.json`:

**Before:**
```json
"extra": {
  "eas": {
    "projectId": "12345678-1234-5678-1234-567812345678"
  }
}
```

**After (with your real ID):**
```json
"extra": {
  "eas": {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

### Step 6: Verify Update
Check that `app.json` has been updated correctly:
```powershell
cd D:\real-estate-marketplace\mobile
cat app.json | Select-String "projectId"
```

You should see your Project ID.

---

## Build After Project Creation

Once you have a valid Project ID in `app.json`:

```powershell
cd D:\real-estate-marketplace\mobile
npx eas build --platform android --profile preview
```

**Expected output:**
```
✅ Build started
Build ID: ...
Waiting for build to complete...
```

---

## Troubleshooting

### "Invalid UUID appId"
- Project ID is not in correct format
- Go to Expo dashboard and copy the exact Project ID
- Make sure it's a UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### "Project not found"
- Project ID doesn't exist
- Create a new project in Expo dashboard
- Copy the new Project ID

### "Not authenticated"
- Run: `npx eas login --browser`
- Authenticate with Google

---

## Quick Checklist

- [ ] Visit https://expo.dev/projects
- [ ] Create new project "PropertyArk Mobile"
- [ ] Copy Project ID
- [ ] Update `mobile/app.json` with Project ID
- [ ] Run `npx eas build --platform android --profile preview`
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Download APK

---

## Support

- **Expo Dashboard**: https://expo.dev/projects
- **EAS Documentation**: https://docs.expo.dev/build/
- **Project ID Format**: UUID (e.g., `12345678-1234-5678-1234-567812345678`)

---

**Status**: Ready to create EAS project  
**Next Step**: Visit Expo dashboard and create project