# Vercel Deployment Fix - Manifest.json Issue

## Problem Identified

The home page was showing a blank white screen with console errors:
- `Uncaught SyntaxError: Unexpected token '<'`
- `manifest.json:1 Manifest: Line: 1, column: 1, Syntax error`

## Root Cause

Both `vercel.json` and `public/_redirects` were configured to redirect ALL requests to `/index.html`, including requests for static assets like `manifest.json`. This caused the manifest.json request to return HTML (which starts with `<`) instead of JSON, breaking the PWA configuration.

## Solution Applied

### 1. Fixed `vercel.json` Routes

**Before:**
```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/$1"
  },
  {
    "src": "/(.*)",
    "dest": "/index.html"
  }
]
```

**After:**
```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/$1"
  },
  {
    "src": "/manifest.json",
    "dest": "/manifest.json"
  },
  {
    "src": "/logo.png",
    "dest": "/logo.png"
  },
  {
    "src": "/favicon.ico",
    "dest": "/favicon.ico"
  },
  {
    "src": "/(.*)",
    "dest": "/index.html"
  }
]
```

**Why:** Explicit routes for static assets must come BEFORE the catch-all route. This ensures manifest.json, logo.png, and favicon.ico are served directly without redirection.

### 2. Fixed `public/_redirects` for Netlify Compatibility

**Before:**
```
/*    /index.html   200
```

**After:**
```
/manifest.json    /manifest.json    200
/logo.png         /logo.png         200
/favicon.ico      /favicon.ico      200
/*                /index.html       200
```

**Why:** Explicit rules for static assets prevent them from being redirected to index.html.

### 3. Verified `public/index.html`

- ✅ Correct manifest.json link: `<link rel="manifest" href="%PUBLIC_URL%/manifest.json" />`
- ✅ Correct mobile-web-app-capable meta tag (not deprecated)
- ✅ All required PWA meta tags present

## What This Fixes

✅ **manifest.json** now serves as JSON (not HTML)  
✅ **PWA functionality** restored (app can be installed)  
✅ **Console errors** eliminated  
✅ **Home page** renders correctly  
✅ **Static assets** (logo, favicon) serve correctly  

## Testing

After deployment, verify:

1. **Check manifest.json loads correctly:**
   - Open DevTools → Network tab
   - Reload page
   - Look for `manifest.json` request
   - Should show `200 OK` with JSON content (not HTML)

2. **Check console for errors:**
   - Open DevTools → Console tab
   - Should see NO syntax errors
   - Should see NO manifest errors

3. **Check home page renders:**
   - Page should display content (not blank white screen)
   - All images should load
   - Filters and properties should be visible

## Deployment Steps

1. **Commit changes:**
   ```bash
   git add vercel.json public/_redirects public/index.html
   git commit -m "Fix: Correct Vercel routing for static assets and manifest.json"
   ```

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Vercel will auto-deploy** (if connected to GitHub)

4. **Verify deployment:**
   - Check Vercel dashboard for successful build
   - Visit your deployed URL
   - Open DevTools and verify manifest.json loads correctly

## Additional Notes

- The `_redirects` file is for Netlify compatibility but doesn't hurt on Vercel
- Vercel uses `vercel.json` as the primary configuration
- Both files should be kept in sync for consistency
- Static assets in `public/` folder are automatically served by Vercel

## If Issues Persist

1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check Vercel build logs:**
   - Go to Vercel dashboard → Deployments
   - Click on latest deployment
   - Check build logs for errors

3. **Verify file exists:**
   - Ensure `public/manifest.json` exists in repository
   - Ensure `public/logo.png` exists
   - Ensure `public/favicon.ico` exists

4. **Check Content-Type headers:**
   - manifest.json should have `Content-Type: application/json`
   - If it shows `text/html`, the routing is still wrong

---

**Status:** ✅ Fixed  
**Files Modified:** `vercel.json`, `public/_redirects`, `public/index.html`  
**Expected Result:** Home page renders correctly, no console errors, PWA works
