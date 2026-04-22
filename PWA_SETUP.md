# PropertyArk PWA Setup

## Overview
PropertyArk is now configured as a Progressive Web App (PWA), allowing it to be installed on mobile devices and work offline.

## PWA Features Enabled

### 1. **Installable**
- Users can install PropertyArk directly from the browser
- Works on Android, iOS, and desktop browsers
- Appears as a native app on home screen

### 2. **Offline Support**
- Service Worker caches essential assets
- Network-first strategy: tries online first, falls back to cache
- Offline page displayed when network unavailable

### 3. **App Manifest**
- `public/manifest.json` defines app metadata
- Includes app name, icons, colors, and shortcuts
- Supports maskable icons for adaptive display

### 4. **Service Worker**
- `public/service-worker.js` handles caching and offline functionality
- Automatically updates cache on new deployments
- Handles fetch requests with network-first strategy

## Installation Instructions

### On Android
1. Open PropertyArk in Chrome or Edge
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home screen"
4. Confirm installation

### On iOS
1. Open PropertyArk in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm and name the app

### On Desktop
1. Open PropertyArk in Chrome/Edge
2. Click the install icon in the address bar
3. Confirm installation

## Files Added/Modified

### New Files
- `public/manifest.json` - PWA manifest with app metadata
- `public/service-worker.js` - Service worker for offline support

### Modified Files
- `public/index.html` - Added PWA meta tags and service worker registration

## Testing PWA Locally

```bash
# Build the app
npm run build

# Serve the build
npm run serve:prod

# Open http://localhost:5000 in browser
# Check DevTools > Application > Manifest to verify PWA setup
```

## Next Steps: Mobile App

Once PWA is verified working:
1. Create `/mobile` directory with Expo setup
2. Use PWA as reference for UI/UX
3. Build native Android APK from mobile directory
4. Test on physical devices

## PWA to APK Conversion

To convert this PWA to a native APK:
1. Use Bubblewrap (Google's tool) for PWA to APK conversion
2. Or use Expo to create native mobile app from React code
3. Or use Capacitor for hybrid app development

## Troubleshooting

### Service Worker not registering
- Check browser console for errors
- Ensure HTTPS is used (or localhost for development)
- Clear browser cache and reload

### App not installable
- Verify manifest.json is valid
- Check that icons are accessible
- Ensure HTTPS is used in production

### Offline features not working
- Check Service Worker in DevTools
- Verify cache storage in DevTools > Application > Cache Storage
- Check network tab to see what's being cached
