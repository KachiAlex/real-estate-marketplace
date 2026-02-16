# Staging Deployment - Command Reference Card

**Print this page or bookmark it for quick access during deployment**

---

## Quick Commands

### Deploy Frontend

```bash
# Option 1: Firebase Hosting
firebase deploy --only hosting

# Option 2: Vercel
vercel --prod

# Option 3: Netlify
netlify deploy --prod

# Option 4: Local Test
serve -s build
```

### Deploy Backend

```bash
# Google Cloud Run
gcloud builds submit --tag gcr.io/[PROJECT_ID]/backend
gcloud run deploy app-staging --image gcr.io/[PROJECT_ID]/backend

# Render.com
git push origin staging  # Auto-deploys

# Traditional Server
git pull origin main && npm install && pm2 restart app
```

### Test Commands

```bash
# Health Check
curl https://[backend]/health

# Socket.IO Connection
# Open browser DevTools (F12) and check Console

# Test API
curl -X GET https://[backend]/api/admin/chat/canned-responses

# Load Test (20 rapid messages)
for i in {1..20}; do curl -X POST https://[backend]/api/chat/send; done

# Message 21 (should get 429)
curl -X POST https://[backend]/api/chat/send
```

---

## URLs During Staging

```
Frontend URL:       [YOUR_STAGING_URL]
Backend URL:        [YOUR_BACKEND_URL]
Health Check:       [BACKEND_URL]/health
Firebase Console:   https://console.firebase.google.com
Firestore:          Firebase Console → Firestore → Collections
```

---

## Environment Variables to Set

```env
FRONTEND_URL=https://[YOUR_STAGING_URL]
SENDGRID_API_KEY=[YOUR_KEY_HERE]
EMAIL_FROM=noreply@propertyark.com
EMAIL_FROM_NAME=Property Ark Support
SUPPORT_EMAIL=admin@propertyark.com
SOCKET_ORIGIN=https://[YOUR_STAGING_URL]
LOG_LEVEL=debug

# Paystack Test Keys
PAYSTACK_SECRET_KEY=sk_test_0bc8b42c70ec2955ac5d61a4b36f463ab47368fb
PAYSTACK_PUBLIC_KEY=pk_test_b03deeb7e613d20289b6523d13f9ad311602c2b3
```

---

## Firestore Setup

### Create Collection
```
Collection: cannedResponses
Documents: 3 samples (Payment Received, Inspection Scheduled, Document Missing)
```

### Security Rules
```javascript
match /cannedResponses/{doc=**} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role == 'admin';
}
```

### Test Connection
```bash
curl -X GET https://[backend]/api/admin/chat/canned-responses \
  -H "Authorization: Bearer [TOKEN]"

# Expected: Array of canned responses
```

---

## Testing Checklist (Quick Version)

```
☐ Test 1: Socket.IO connects (Console should show "Socket connected")
☐ Test 2: Canned responses CRUD (Create, read, update, delete work)
☐ Test 3: Email notification (Send urgent chat, check email inbox)
☐ Test 4: Chat history (Create 2 chats, see history tab)
☐ Test 5: Rate limiting (Send 20 → OK, 21st → 429 error)
☐ Test 6: Auto-archive (Set old conversation, run archive function)
☐ Test 7: Performance (Page loads < 3 sec, API < 1 sec)
```

---

## If Something Breaks

| Problem | Solution | Time |
|---------|----------|------|
| Socket.IO timeout | Restart backend | 2 min |
| Email not sending | Check SENDGRID_API_KEY | 5 min |
| 404 on JS files | Clear cache, rebuild | 5 min |
| Rate limit broken | Check backend/server.js lines 372-405 | 5 min |
| Firestore error | Verify rules and collection exists | 3 min |
| API 500 error | Check backend logs | 5 min |

---

## Important Files Modified

```
Frontend:
✓ src/components/AdminChatSupport.js
✓ src/components/AdminChatButton.js

Backend:
✓ backend/routes/adminChat.js
✓ backend/services/chatService.js
✓ backend/services/emailService.js
✓ backend/models/Chat.js
✓ backend/server.js
```

---

## Key Endpoints to Test

```bash
# Get canned responses
GET /api/admin/chat/canned-responses

# Create canned response
POST /api/admin/chat/canned-responses
Body: { title, message, category }

# Delete canned response
DELETE /api/admin/chat/canned-responses/:id

# Get user conversations
GET /api/chat/conversations

# Health check
GET /health

# Expected responses: 200 OK (or 201 Created)
# Errors return 400/401/403/429/500 with error message
```

---

## Rate Limit Values

```
Messages per 15 min:       20
Conversations per hour:    5
Admin bypass:              YES (admins not limited)
Window reset:              Every 15 min / 1 hour
Error code:                429 Too Many Requests
```

---

## Deployment Sequence (30 Steps)

```
☐ 1. Pre-checks complete
☐ 2. Staging creds ready
☐ 3. Frontend deploy started
☐ 4. Frontend loaded
☐ 5. No 404 errors
☐ 6. Admin dashboard accessible
☐ 7. Backend deploy started
☐ 8. Backend health check passes
☐ 9. Environment vars set
☐ 10. Firestore collection created
☐ 11. Security rules deployed
☐ 12. Sample docs added
☐ 13. Socket.IO test pass
☐ 14. Canned responses test pass
☐ 15. Email test pass
☐ 16. Chat history test pass
☐ 17. Rate limit test pass
☐ 18. Auto-archive test pass
☐ 19. Performance test pass
☐ 20. All tests documented
☐ 21. Admin team briefed
☐ 22. Admin feedback collected
☐ 23. Issues logged (if any)
☐ 24. Critical issues fixed
☐ 25. Retest critical fixes
☐ 26. Admin approval received
☐ 27. Rollback plan ready
☐ 28. Production go decision
☐ 29. Production deploy ready
☐ 30. Monitoring set up
```

---

## Success Criteria

```
MUST PASS (Required):
✅ All tests pass
✅ No critical errors
✅ Admin approves
✅ Email working
✅ Socket.IO stable

SHOULD PASS (Recommended):
✅ Performance < 3 sec
✅ No console errors
✅ Clean logs
✅ Rate limiting effective
```

---

## Contact During Deployment

```
Socket.IO Issue?      → Check backend/server.js lines 50-100
Email Issue?          → Check backend/services/emailService.js
Rate Limit Issue?     → Check backend/server.js lines 372-405
API Issue?            → Check backend logs
Frontend Issue?       → Check browser console (F12)
Database Issue?       → Check Firestore rules
```

---

## Post-Deployment Monitoring

```
Hour 1:   ✅ Services online, no errors
Hour 4:   ✅ Stable, normal traffic
Hour 8:   ✅ All metrics green
Hour 24:  ✅ Ready for production

Metrics to Watch:
- Page Load Time: < 3 sec
- API Response: < 1 sec
- Error Rate: < 0.1%
- Socket.IO Connect: > 99%
- Email Delivery: > 95%
```

---

## Rollback Command

```bash
# Complete rollback in 10 minutes
git revert HEAD~1
git push origin main
npm run build
firebase deploy --only hosting
pm2 restart backend
```

---

## Documentation URLs (In This Repo)

```
STAGING_DEPLOYMENT_EXECUTION.md     ← Full step-by-step guide
STAGING_MONITORING_DASHBOARD.md     ← Fill in test results here
QUICK_REFERENCE.md                  ← Quick answers
LIVE_CHAT_FIXES_IMPLEMENTED.md      ← What changed & why
LIVE_CHAT_CODE_IMPLEMENTATION.md    ← Code examples & APIs
```

---

## Copy-Paste Sections

### Pre-Deploy Notification
```
Team, we're deploying live chat fixes to staging.
Deployment window: [TIME]
Duration: ~2 hours
Testing required: 7 tests, ~60 min
When ready: We'll test and get approval

Features being deployed:
✅ Socket.IO works everywhere
✅ Canned responses for admins
✅ Email notifications for urgent chats
✅ Chat history for users
✅ Auto-archive old conversations
✅ Rate limiting for spam protection
```

### Deployment Success Notification
```
✅ STAGING DEPLOYMENT COMPLETE

All systems online:
- Frontend: Live at [URL]
- Backend: Responding
- Database: Connected
- Tests: 7/7 PASS

Next: 24-hour monitoring, then production deploy

Admin feedback deadline: [TIME]
Production go/no-go decision: [TIME]
```

### Issue Notification
```
⚠️  ISSUE FOUND DURING TESTING

Issue: [Describe]
Severity: [Critical/High/Medium/Low]
Impact: [Users/Admins/System]
Status: [Investigating/Fixing/Resolved]
ETA: [Time to fix]

Actions: [What we're doing]
Workaround: [Temp fix if any]
Updates: Every 30 minutes
```

---

## Key Contacts

```
Development Lead:   ____________
Backend Lead:       ____________
Frontend Lead:      ____________
Product Manager:    ____________
On-Call Engineer:   ____________
```

---

## Deployment Timeline

```
Start:              ___:___ PM
Frontend Done:      ___:___ PM (target: +15 min)
Backend Done:       ___:___ PM (target: +25 min)
Database Done:      ___:___ PM (target: +30 min)
Tests Start:        ___:___ PM (target: +30 min)
Tests Complete:     ___:___ PM (target: +90 min)
Admin Feedback:     ___:___ PM (target: +120 min)
Go Decision:        ___:___ PM (target: +150 min)

Total Duration:     ___ hours
Status:             [✅ ON TIME / ⚠️ DELAYED / ❌ BLOCKED]
```

---

**Bookmark this page and check off each step as you go!** ✅

Good luck with your staging deployment! 🚀
