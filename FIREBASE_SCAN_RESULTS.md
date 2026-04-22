# Firebase Scan Results - Second Pass

**Date:** April 8, 2026  
**Status:** ADDITIONAL FIREBASE REFERENCES FOUND

---

## Summary

Found **8 additional Firebase references** that need to be addressed:

---

## 1. ⚠️ mobile-app/src/config/env.js

**Status:** ❌ NEEDS FIX  
**Severity:** HIGH

### Issue:
- Contains Firebase configuration object
- References Firebase environment variables
- Not being used (should use Render API instead)

### Fix:
Replace with Render backend configuration

---

## 2. ⚠️ src/components/PropertyCreationTest.js

**Status:** ❌ NEEDS FIX  
**Severity:** MEDIUM

### Issue:
- References `firebaseAuthReady` variable
- References `window.auth?.currentUser` (Firebase)
- Test component checking Firebase auth state

### Fix:
Update to check Render backend auth state

---

## 3. ⚠️ src/services/__tests__/storageService.test.js

**Status:** ❌ NEEDS FIX  
**Severity:** MEDIUM

### Issue:
- Mocks Firebase Storage
- Imports from `firebase/storage`
- Jest mock for Firebase

### Fix:
Update test mocks to use Render backend

---

## 4. ⚠️ scripts/package.json

**Status:** ❌ NEEDS FIX  
**Severity:** HIGH

### Issue:
- Contains `firebase` v12.2.1 dependency
- Separate package.json in scripts directory

### Fix:
Remove Firebase dependency

---

## 5. ⚠️ PropertyArkClean/package.json

**Status:** ❌ NEEDS FIX  
**Severity:** HIGH

### Issue:
- Separate React Native app directory
- Contains `firebase` v10.0.0 dependency
- Appears to be a backup/clean version

### Fix:
Remove Firebase dependency

---

## 6. ⚠️ PropertyArkFresh/package.json

**Status:** ❌ NEEDS FIX  
**Severity:** HIGH

### Issue:
- Separate React Native app directory
- Contains `firebase` v10.0.0 dependency
- Appears to be a backup/fresh version

### Fix:
Remove Firebase dependency

---

## 7. ⚠️ functions/package.json

**Status:** ❌ NEEDS FIX  
**Severity:** HIGH

### Issue:
- Contains `firebase-functions` v7.0.5
- Separate functions directory
- Firebase Cloud Functions deployment

### Fix:
Remove Firebase Functions dependency

---

## 8. ⚠️ functions-backup/package.json

**Status:** ❌ NEEDS FIX  
**Severity:** MEDIUM

### Issue:
- Contains `firebase-admin` v12.0.0
- Contains `firebase-functions` v7.0.5
- Backup directory but still has dependencies

### Fix:
Remove Firebase dependencies

---

## 9. ✅ package.json (Main)

**Status:** SAFE

### Issue:
- Jest moduleNameMapper references Firebase
- But only for mocking purposes

### Fix:
Update Jest config to remove Firebase mock

---

## 10. ✅ public/firebase-messaging-sw.js

**Status:** SAFE (Already handled)

- Already has graceful degradation
- No changes needed

---

## 11. ✅ build2/ and build3/ directories

**Status:** SAFE (Build artifacts)

- Compiled JavaScript files
- Will be regenerated on next build
- No action needed

---

## 12. ✅ functions-backup/ and functions/ directories

**Status:** LEGACY (Can be deleted)

- Backup/legacy code
- Not actively used
- Safe to delete

---

## 13. ✅ Firebase domain references

**Status:** SAFE (Not Firebase code)

- References to `real-estate-marketplace-37544.web.app` in URLs
- These are just domain names in strings
- Safe to leave (or update to new domain)

---

## Action Items

### CRITICAL - Must Fix:

1. **mobile-app/src/config/env.js**
   - [ ] Remove Firebase config object
   - [ ] Add Render backend config

2. **scripts/package.json**
   - [ ] Remove `firebase` dependency

3. **PropertyArkClean/package.json**
   - [ ] Remove `firebase` dependency

4. **PropertyArkFresh/package.json**
   - [ ] Remove `firebase` dependency

5. **functions/package.json**
   - [ ] Remove `firebase-functions` dependency

6. **functions-backup/package.json**
   - [ ] Remove `firebase-admin` and `firebase-functions`

### HIGH - Should Fix:

7. **src/components/PropertyCreationTest.js**
   - [ ] Update to use Render backend auth state
   - [ ] Remove Firebase references

8. **src/services/__tests__/storageService.test.js**
   - [ ] Update test mocks
   - [ ] Remove Firebase imports

### MEDIUM - Can Fix:

9. **package.json (Main)**
   - [ ] Update Jest moduleNameMapper
   - [ ] Remove Firebase mock

### LOW - Optional:

10. **Delete backup directories**
    - [ ] Delete `PropertyArkClean/`
    - [ ] Delete `PropertyArkFresh/`
    - [ ] Delete `functions-backup/`
    - [ ] Delete `functions/`

---

## Files to Delete (Optional)

```
PropertyArkClean/          - Backup React Native app
PropertyArkFresh/          - Backup React Native app
functions/                 - Legacy Firebase Functions
functions-backup/          - Backup Firebase Functions
functions-index.js         - Already deprecated
```

---

## Summary Table

| File | Firebase Ref | Status | Action |
|---|---|---|---|
| mobile-app/src/config/env.js | Config object | ❌ CRITICAL | Remove |
| scripts/package.json | Dependency | ❌ CRITICAL | Remove |
| PropertyArkClean/package.json | Dependency | ❌ CRITICAL | Remove |
| PropertyArkFresh/package.json | Dependency | ❌ CRITICAL | Remove |
| functions/package.json | Dependency | ❌ CRITICAL | Remove |
| functions-backup/package.json | Dependencies | ❌ CRITICAL | Remove |
| PropertyCreationTest.js | Auth state | ⚠️ HIGH | Update |
| storageService.test.js | Mocks | ⚠️ HIGH | Update |
| package.json (Main) | Jest config | ⚠️ MEDIUM | Update |
| firebase-messaging-sw.js | Service worker | ✅ SAFE | No action |
| build2/, build3/ | Artifacts | ✅ SAFE | No action |

---

**Status:** SCAN COMPLETE - 9 items need fixing
