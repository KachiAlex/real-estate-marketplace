# Firebase References Audit Report

**Date:** April 8, 2026  
**Status:** COMPREHENSIVE SWEEP COMPLETED

---

## Summary

Found **5 distinct Firebase-dependent components** across the codebase. These are separate from the main web app and mobile app we already fixed.

---

## 1. ⚠️ PropertyArkRN (Separate React Native App)

**Location:** `PropertyArkRN/` directory  
**Status:** ❌ ACTIVELY USING FIREBASE  
**Severity:** CRITICAL

### Firebase Dependencies:
- `firebase` v10.0.0 in package.json
- `@expo/config-plugins` v7.0.0 (outdated, should be ~9.0.0)

### Firebase Usage:
- **Config:** `PropertyArkRN/src/config/firebase.js` - Full Firebase initialization
- **Auth:** 
  - `PropertyArkRN/src/screens/LoginScreen.js` - Uses `signInWithEmailAndPassword`, `signAnonymously`
  - `PropertyArkRN/src/screens/RegisterScreen.js` - Uses `createUserWithEmailAndPassword`, `updateProfile`
  - `PropertyArkRN/src/screens/ProfileScreen.js` - Uses `signOut`
  - `PropertyArkRN/src/navigation/AppNavigator.js` - Uses `onAuthStateChanged`
- **Services:** Firestore (db) and Storage (storage) initialized but not actively used in screens

### Files to Update:
```
PropertyArkRN/
├── package.json (remove firebase, update @expo/config-plugins)
├── src/
│   ├── config/firebase.js (replace with Render API config)
│   ├── screens/
│   │   ├── LoginScreen.js (refactor to use Render backend)
│   │   ├── RegisterScreen.js (refactor to use Render backend)
│   │   └── ProfileScreen.js (refactor to use Render backend)
│   └── navigation/
│       └── AppNavigator.js (replace onAuthStateChanged with Render auth check)
```

---

## 2. ⚠️ Firebase Cloud Functions

**Location:** `functions-index.js`  
**Status:** ❌ FIREBASE FUNCTIONS DEPLOYMENT  
**Severity:** HIGH

### Issue:
- Entire file is Firebase Cloud Functions wrapper
- Uses `firebase-functions` and `firebase-admin`
- Exports as `exports.api = functions.https.onRequest(app)`

### Purpose:
- Verification applications API
- Admin verification endpoints
- Health checks

### Action Required:
- This should be migrated to Render backend
- Currently appears to be a legacy deployment method
- The actual logic (verification endpoints) should be in `backend/server.js`

---

## 3. ⚠️ Firebase Messaging Service Worker

**Location:** `build3/firebase-messaging-sw.js`  
**Status:** ⚠️ CONDITIONAL FIREBASE  
**Severity:** MEDIUM

### Current Behavior:
- Attempts to fetch Firebase config from `/api/config/firebase`
- Only initializes if config is returned
- Acts as no-op if Firebase config not available
- Already designed to work without Firebase

### Status:
- ✅ Already handles graceful degradation
- ✅ No hardcoded Firebase credentials
- ⚠️ Still tries to load Firebase scripts if config available

### Action:
- Can be left as-is (safe)
- Or remove Firebase messaging entirely if not needed

---

## 4. ⚠️ Firebase Backup Functions

**Location:** `functions-backup/` directory  
**Status:** ⚠️ BACKUP/LEGACY CODE  
**Severity:** LOW

### Firebase References:
- `functions-backup/server.js` - References Firebase hosting domains in CORS
- `functions-backup/middleware/auth.js` - Has Firebase token verification fallback
- `functions-backup/config/firestore.js` - Firestore initialization

### Status:
- This is a backup directory (not active)
- Contains legacy deployment code
- Safe to ignore or delete

---

## 5. ⚠️ Seed Data Script

**Location:** `scripts/seed-data.js`  
**Status:** ⚠️ LEGACY SCRIPT  
**Severity:** LOW

### Issue:
- Uses Firebase/Firestore to seed initial data
- Imports from `firebase/firestore`
- Hardcoded Firebase config

### Status:
- Not actively used (appears to be development script)
- Can be replaced with Render backend API calls
- Or deleted if data seeding is handled elsewhere

---

## 6. ✅ Backend Server (Main)

**Location:** `backend/server.js`  
**Status:** ✅ ALREADY MIGRATED  
**Severity:** NONE

### Firebase References:
- Only references Firebase hosting domains in CORS whitelist
- No actual Firebase dependencies
- Already uses JWT authentication (not Firebase)

### Status:
- ✅ Safe - no Firebase code
- ✅ Uses Render backend properly

---

## 7. ✅ Web App (Main)

**Location:** `src/` directory  
**Status:** ✅ ALREADY FIXED  
**Severity:** NONE

### Status:
- ✅ Firebase config is stub only
- ✅ Auth context uses Render backend
- ✅ No Firebase imports in code

---

## 8. ✅ Mobile App (mobile-app/)

**Location:** `mobile-app/` directory  
**Status:** ✅ ALREADY FIXED  
**Severity:** NONE

### Status:
- ✅ Firebase removed from package.json
- ✅ Render API client created
- ✅ Ready for build

---

## Action Items

### CRITICAL - Must Fix Before Build:

1. **PropertyArkRN App** - Refactor to use Render backend
   - [ ] Update package.json (remove firebase, update @expo/config-plugins)
   - [ ] Replace Firebase config with Render API client
   - [ ] Refactor LoginScreen.js
   - [ ] Refactor RegisterScreen.js
   - [ ] Refactor ProfileScreen.js
   - [ ] Update AppNavigator.js

### HIGH - Should Fix:

2. **functions-index.js** - Migrate to Render backend
   - [ ] Move verification endpoints to backend/server.js
   - [ ] Remove Firebase Functions wrapper
   - [ ] Deploy to Render instead

### MEDIUM - Can Leave As-Is:

3. **Firebase Messaging Service Worker** - Optional
   - [ ] Leave as-is (gracefully handles no Firebase)
   - [ ] Or remove Firebase messaging entirely

### LOW - Can Ignore:

4. **functions-backup/** - Legacy code
   - [ ] Can be deleted or archived
   - [ ] Not actively used

5. **scripts/seed-data.js** - Legacy script
   - [ ] Can be deleted or replaced with Render API calls
   - [ ] Not actively used

---

## Firebase Credentials Found

### Hardcoded in Code:
- `PropertyArkRN/src/config/firebase.js` - Full Firebase config exposed
- `scripts/seed-data.js` - Firebase config exposed

### In CORS Whitelist (Safe):
- `backend/server.js` - Firebase hosting domains (no credentials)
- `functions-backup/server.js` - Firebase hosting domains (no credentials)

### Recommendation:
- Remove hardcoded Firebase configs from PropertyArkRN
- Use environment variables if Firebase is needed
- Or remove entirely since migrating to Render

---

## Dependency Analysis

### Firebase Packages Found:
```
firebase (v10.0.0) - PropertyArkRN/package.json
firebase-functions - functions-index.js
firebase-admin - functions-index.js, functions-backup/
```

### Packages to Remove:
```
PropertyArkRN/package.json:
  - firebase (v10.0.0)
  - Update @expo/config-plugins to ~9.0.0

functions-index.js:
  - firebase-functions
  - firebase-admin

scripts/seed-data.js:
  - firebase (import only, not in package.json)
```

---

## Verification Checklist

- [x] Searched entire codebase for Firebase references
- [x] Identified all Firebase-dependent components
- [x] Checked for hardcoded credentials
- [x] Analyzed dependency chains
- [x] Assessed severity of each reference
- [x] Documented action items

---

## Next Steps

1. **Immediate:** Fix PropertyArkRN app (CRITICAL)
2. **Short-term:** Migrate functions-index.js to Render (HIGH)
3. **Optional:** Remove Firebase messaging service worker (MEDIUM)
4. **Cleanup:** Delete or archive backup directories (LOW)

---

## Files Summary

| File/Directory | Firebase Usage | Status | Action |
|---|---|---|---|
| PropertyArkRN/ | Active (Auth, Firestore, Storage) | ❌ CRITICAL | Refactor to Render |
| functions-index.js | Cloud Functions wrapper | ❌ HIGH | Migrate to Render |
| build3/firebase-messaging-sw.js | Conditional messaging | ⚠️ MEDIUM | Optional cleanup |
| functions-backup/ | Legacy code | ⚠️ LOW | Delete/Archive |
| scripts/seed-data.js | Firestore seeding | ⚠️ LOW | Delete/Replace |
| backend/server.js | CORS only (safe) | ✅ OK | No action |
| src/ (web app) | Stub only (safe) | ✅ OK | No action |
| mobile-app/ | Already fixed | ✅ OK | No action |

---

**Report Generated:** April 8, 2026  
**Audit Status:** COMPLETE  
**Recommendation:** Address CRITICAL and HIGH items before production deployment
