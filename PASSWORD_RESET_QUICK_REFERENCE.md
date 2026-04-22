# Password Reset - Quick Reference Guide

## 🎯 Your Current Setup

**Status:** Custom backend password reset (NOT using Firebase Auth native)

- ✅ Custom endpoint: `/api/auth/forgot-password`
- ✅ Token stored in Firestore
- ✅ Custom email templates
- ✅ Full control over flow

## 🚨 If You're Getting 500 Errors

### Quick Diagnostic (5 minutes)

1. **Check backend logs:**
   ```bash
   # Firebase Console → Cloud Run → Logs
   # OR
   gcloud logging read "severity>=ERROR" --limit 20
   ```

2. **Test endpoint directly:**
   ```bash
   curl -X POST https://your-api-url/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Verify environment variables:**
   - `FRONTEND_URL` set?
   - Email service API key configured?
   - Firestore credentials valid?

### Most Common Issues

| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| **Email service down** | Email not sent | Check SendGrid/Nodemailer status |
| **Firestore permissions** | Can't save token | Check service account roles |
| **Missing env vars** | Undefined errors | Set all required variables |
| **CORS error** | Frontend can't call API | Check CORS middleware |
| **Rate limiting** | Too many requests | Adjust rate limit settings |

## 🔄 Should You Migrate to Firebase Auth Native?

### Keep Custom If:
- ✅ It's working reliably
- ✅ You need custom email templates
- ✅ You want full control
- ✅ You have specific business logic

### Migrate to Firebase Auth If:
- ✅ You want Google-managed reliability
- ✅ You're getting frequent errors
- ✅ You want simpler maintenance
- ✅ You need better mobile integration

## 📋 Firebase Configuration (If Migrating)

### Required Checks:

1. **API Key Match**
   - Firebase Console → Project Settings → Web App
   - Copy API key to `src/config/firebase.js`

2. **Authorized Domains**
   - Firebase Console → Authentication → Settings
   - Add: `localhost`, `your-project.firebaseapp.com`, `your-project.web.app`

3. **Email Templates**
   - Firebase Console → Authentication → Templates
   - Configure password reset template

4. **Enabled APIs**
   - Google Cloud Console → APIs & Services
   - Enable: Identity Toolkit API, Firebase Authentication API

## 🛠️ Quick Actions

### Option A: Fix Current Custom Implementation

1. Check `PASSWORD_RESET_DIAGNOSTIC_CHECKLIST.md` for detailed steps
2. Focus on backend logs to find exact error
3. Test email service separately
4. Verify Firestore write permissions

### Option B: Migrate to Firebase Auth Native

1. Review `PASSWORD_RESET_ANALYSIS.md` for migration plan
2. Complete Firebase configuration checklist above
3. Update frontend to use `sendPasswordResetEmail`
4. Test thoroughly before removing custom code

### Option C: Hybrid Approach

- Use Firebase Auth for new users
- Keep custom for existing users
- Gradually migrate users over time

## 📝 Code Changes Needed (If Migrating)

### Frontend (`src/pages/ForgotPassword.js`):

**Before (Custom):**
```javascript
const response = await fetch(`${getApiUrl()}/api/auth/forgot-password`, {
  method: 'POST',
  body: JSON.stringify({ email })
});
```

**After (Firebase Auth):**
```javascript
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

await sendPasswordResetEmail(auth, email);
```

### Backend:

**Before:** Custom endpoint `/api/auth/forgot-password`  
**After:** Remove endpoint (handled by Firebase)

### Reset Page (`src/pages/ResetPassword.js`):

**Before:** Custom endpoint `/api/auth/reset-password`  
**After:** Use Firebase `confirmPasswordReset`

## 🎯 Recommendation

**If your custom implementation is working:**
- ✅ Keep it! Fix any specific 500 errors
- ✅ Follow diagnostic checklist
- ✅ Monitor logs for improvements

**If you're having persistent issues:**
- Consider migrating to Firebase Auth native
- Better reliability and less maintenance
- Simpler codebase

## 📚 Related Documents

- `PASSWORD_RESET_ANALYSIS.md` - Detailed analysis and migration options
- `PASSWORD_RESET_DIAGNOSTIC_CHECKLIST.md` - Comprehensive diagnostic steps

## 🆘 Need Help?

1. **Check backend logs first** - Most issues show up there
2. **Test endpoint directly** - Bypass frontend to isolate issue
3. **Verify each service separately** - Email, Database, API
4. **Use diagnostic checklist** - Systematic troubleshooting

---

**Next Step:** Decide if you want to:
- A) Diagnose and fix current custom implementation
- B) Migrate to Firebase Auth native
- C) Understand the differences better first

Then check the appropriate document for detailed steps!

