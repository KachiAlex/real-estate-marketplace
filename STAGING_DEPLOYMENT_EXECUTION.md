# Staging Deployment Execution Plan

**Status**: Build ✅ Ready | Backend ✅ Ready | Frontend Build ✅ Complete  
**Date**: January 31, 2026  
**Duration**: ~2 hours total (15 min deployment + 1 hour testing + buffer)

---

## Part 1: Pre-Deployment Checklist (5 min)

### Verify Code Ready
- [x] All 7 files modified and committed
- [x] npm run build successful (51 JS chunks)
- [x] build/ folder ready at: `D:\real-estate-marketplace\build`
- [x] No build errors (only ESLint warnings)

### Verify Environment
- [x] Node.js running and npm working
- [x] Git updated with latest changes
- [x] Staging credentials available (Firebase/Vercel/server)
- [x] Staging database access ready

### Verify Documentation
- [x] QUICK_REFERENCE.md - for troubleshooting
- [x] LIVE_CHAT_FIXES_DEPLOYED.md - what changed
- [x] LIVE_CHAT_CODE_IMPLEMENTATION.md - API docs
- [x] Test checklist available

**✅ All pre-checks passed. Proceed to deployment.**

---

## Part 2: Frontend Deployment (10 min)

Choose ONE of the three options below based on your hosting platform:

### Option 1: Firebase Hosting
```bash
# If using Firebase
cd D:\real-estate-marketplace
firebase deploy --only hosting

# Verify
# - Visit your staging URL in browser
# - Should see Property Ark application loading
# - Check browser console for errors (F12)
# - Confirm no 404 on main.*.js files
```

**Deployment URL**: `https://[YOUR_PROJECT_ID].web.app`  
**Status**: ⏳ Execute this in terminal

---

### Option 2: Vercel
```bash
# If using Vercel
cd D:\real-estate-marketplace

# Ensure vercel.json exists at root with:
# {
#   "buildCommand": "npm run build",
#   "outputDirectory": "build",
#   "env": ["REACT_APP_FIREBASE_*", "REACT_APP_API_URL"]
# }

vercel --prod  # Deploy to production Vercel (or staging environment)

# Verify
# - Visit provided Vercel URL
# - Check Network tab for JS chunk loading
# - Confirm real-time updates work
```

**Deployment URL**: `https://[PROJECT_NAME].vercel.app`  
**Status**: ⏳ Execute this in terminal

---

### Option 3: Netlify
```bash
# If using Netlify
cd D:\real-estate-marketplace

# Ensure netlify.toml exists at root with:
# [build]
#   command = "npm run build"
#   publish = "build"
# [[redirects]]
#   from = "/*"
#   to = "/index.html"
#   status = 200

netlify deploy --prod

# Verify
# - Visit provided Netlify URL
# - Check console for Socket.IO connection logs
# - Confirm all JS loads without 404
```

**Deployment URL**: `https://[PROJECT_NAME].netlify.app`  
**Status**: ⏳ Execute this in terminal

---

### Option 4: Simple Node Server (for testing)
```bash
# Quick test deployment without CI/CD
cd D:\real-estate-marketplace

# Install serve if needed
npm install -g serve

# Start server on port 3000
serve -s build

# Test URL: http://localhost:3000
# In another terminal, test it works:
# curl http://localhost:3000 | grep "<title>"
```

**Deployment URL**: `http://localhost:3000` or `http://[YOUR_IP]:3000`  
**Status**: ⏳ Execute this in terminal

---

### ✅ Frontend Deployment Complete When:
- [ ] Staging URL responds with 200 OK
- [ ] `index.html` loads
- [ ] No 404 errors in Network tab
- [ ] No red errors in browser console
- [ ] Admin dashboard accessible at `/admin`

**Frontend Status**: ⏳ Awaiting deployment

---

## Part 3: Backend Deployment (10 min)

### A. Update Environment Variables

Update your staging backend environment file with these values:

```env
# Required for chat system to work
FRONTEND_URL=https://[YOUR_STAGING_URL]
# Examples:
# FRONTEND_URL=https://yourapp-staging.web.app
# FRONTEND_URL=https://yourapp.vercel.app
# FRONTEND_URL=https://yourapp.netlify.app
# FRONTEND_URL=http://localhost:3000

# Email configuration (for notifications)
EMAIL_PROVIDER=sendgrid  # or "smtp"
SENDGRID_API_KEY=[YOUR_SENDGRID_KEY]
EMAIL_FROM=noreply@propertyark.com
EMAIL_FROM_NAME=Property Ark Support

# Database
FIREBASE_PROJECT_ID=[YOUR_STAGING_PROJECT_ID]
FIREBASE_PRIVATE_KEY=[YOUR_STAGING_PRIVATE_KEY]
FIREBASE_CLIENT_EMAIL=[YOUR_STAGING_CLIENT_EMAIL]

# Socket.IO
SOCKET_ORIGIN=https://[YOUR_STAGING_URL]

# Optional
LOG_LEVEL=debug  # for troubleshooting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_MESSAGES=20   # messages per window
RATE_LIMIT_MAX_CONVERSATIONS=5  # per hour
```

**Status**: ⏳ Update environment file in your backend config

### B. Deploy Backend Code

Choose your deployment platform:

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/[PROJECT_ID]/property-ark-backend
gcloud run deploy property-ark-backend-staging \
  --image gcr.io/[PROJECT_ID]/property-ark-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars FRONTEND_URL=https://[STAGING_URL],SENDGRID_API_KEY=[KEY],EMAIL_FROM=noreply@propertyark.com
```

#### Render.com
```bash
# Deploy from git (automatic CI/CD)
# 1. Push to staging branch: git push origin staging
# 2. Render detects changes and auto-deploys
# 3. Visit: https://[app-name].onrender.com
# 4. Verify environment variables set in Render dashboard
```

#### Traditional Server
```bash
# SSH into server
ssh user@staging-server.com

# Pull latest code
cd /home/app/backend
git pull origin main

# Install dependencies and restart
npm install
pm2 restart property-ark-backend
```

**Status**: ⏳ Deploy backend to your platform

### ✅ Backend Deployment Complete When:
- [ ] Backend responds to health check: `GET https://[backend]/health`
- [ ] Returns: `{ "status": "ok" }`
- [ ] Environment variables loaded: `GET https://[backend]/env-check`
- [ ] No errors in backend logs

---

## Part 4: Firestore Setup (5 min)

### Step 1: Verify Database Connection

```bash
# In Node.js or browser console, test connection:
curl -X GET https://[BACKEND_URL]/health

# Should return:
# { "status": "ok", "database": "connected" }
```

### Step 2: Create Firestore Collection

In Firebase Console:

```
1. Go to: Firebase Console → Firestore → Data
2. Create collection: "cannedResponses"
3. Set security rules (see below)
4. Add sample documents (see examples below)
```

### Step 3: Add Security Rules

Update Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read chat conversations
    match /chatConversations/{conversationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      (request.auth.token.role == 'admin' || 
                       request.resource.data.userId == request.auth.uid);
    }
    
    // Allow all users to read canned responses
    match /cannedResponses/{doc=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Allow users to create their own user docs
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth.token.role == 'admin';
      allow write: if request.auth.uid == userId || request.auth.token.role == 'admin';
    }
  }
}
```

### Step 4: Add Sample Canned Responses

In Firestore, add these test documents to `cannedResponses`:

```json
{
  "id": "canned-1",
  "title": "Payment Received",
  "message": "Thank you for your payment. We have received it and will process it within 2 business days.",
  "category": "payment",
  "createdAt": "2026-01-31T00:00:00Z",
  "updatedAt": "2026-01-31T00:00:00Z"
}
```

```json
{
  "id": "canned-2",
  "title": "Inspection Scheduled",
  "message": "Your property inspection has been scheduled. Please confirm your availability for the scheduled time.",
  "category": "inspection",
  "createdAt": "2026-01-31T00:00:00Z",
  "updatedAt": "2026-01-31T00:00:00Z"
}
```

```json
{
  "id": "canned-3",
  "title": "Document Missing",
  "message": "We need additional documents to proceed. Please upload the required files in your account portal.",
  "category": "documents",
  "createdAt": "2026-01-31T00:00:00Z",
  "updatedAt": "2026-01-31T00:00:00Z"
}
```

**Status**: ⏳ Create collection in Firebase

### ✅ Firestore Setup Complete When:
- [ ] `cannedResponses` collection exists
- [ ] 3 sample documents added
- [ ] Security rules deployed
- [ ] Can read via API: `GET https://[backend]/api/admin/chat/canned-responses`

---

## Part 5: Staging Validation Tests (60 min)

**Go through each test below. Aim for 100% pass rate.**

### Test 1: Socket.IO Real-Time Connection (5 min)

**Purpose**: Verify WebSocket works and admins see messages instantly

**Steps**:
1. Open staging frontend in Chrome
2. Open Developer Tools: `F12 → Console`
3. Create a new chat message as a regular user
4. Go to Admin Dashboard `/admin`
5. Check for Socket.IO connection in console

**Expected Results**:
```
✅ Console shows: "Socket connected successfully"
✅ Admin dashboard loads without errors
✅ Chat message appears immediately (< 1 second)
✅ No WebSocket errors in Console
```

**If Failed**: 
- Check FRONTEND_URL environment variable
- Verify backend is running
- Check CORS in backend/server.js
- Clear browser cache and reload

---

### Test 2: Canned Responses CRUD (10 min)

**Purpose**: Verify admins can create, read, update, delete quick responses

**Setup**:
- Logged in as admin user
- At Admin Dashboard `/admin/chat`

**Test A: Create**
```bash
# In admin dashboard, click "Manage Canned Responses"
# Click "Add New Response"
# Title: "Test Response"
# Message: "This is a test quick reply"
# Category: "general"
# Click Save
```

**Expected**: Response appears in list immediately

**Test B: Read**
```bash
# List should show:
✅ "Payment Received"
✅ "Inspection Scheduled"  
✅ "Document Missing"
✅ "Test Response" (just created)
```

**Test C: Update**
```bash
# Click "Edit" on "Test Response"
# Change message to: "Updated test message"
# Click Save
```

**Expected**: Changes appear immediately

**Test D: Delete**
```bash
# Click "Delete" on "Test Response"
# Confirm deletion
```

**Expected**: Response removed from list

**API Validation** (in browser DevTools Network tab):
```
✅ POST /api/admin/chat/canned-responses - 201 Created
✅ GET /api/admin/chat/canned-responses - 200 OK (returns array)
✅ PATCH /api/admin/chat/canned-responses/:id - 200 OK
✅ DELETE /api/admin/chat/canned-responses/:id - 200 OK
```

**If Failed**:
- Check admin role set in Firebase (role = 'admin')
- Verify Firestore cannedResponses collection exists
- Check firestore.rules for write permissions
- Check backend logs for errors

---

### Test 3: Email Notifications for Urgent Chats (10 min)

**Purpose**: Verify admins get email alerts for important messages

**Setup**:
- Admin email configured in backend
- SendGrid/SMTP working
- Admin user has `notifications: true` in Firestore

**Steps**:
1. Create a new chat as regular user
2. Set priority to "urgent"
3. Send message: "This is an urgent issue"
4. Check admin email inbox (wait up to 2 min)
5. Verify email received

**Expected Email**:
```
From: noreply@propertyark.com
Subject: New Urgent Chat from [User Name]
Body:
- Contact Name: [User Name]
- Contact Email: [User Email]
- Chat Category: [Category]
- Priority: 🔴 URGENT
- Dashboard Link: [Link to admin chat]
```

**If Failed**:
- Check SENDGRID_API_KEY in backend env
- Verify EMAIL_FROM is correct
- Check admin.notifications = true in Firestore
- Check backend logs for email send errors
- Check spam folder

---

### Test 4: Chat History for Users (10 min)

**Purpose**: Verify users can see and continue past conversations

**Setup**:
- Regular user account
- Create 2 past conversations (or use existing)
- One resolved, one open

**Steps**:
1. Open chat widget (bottom right)
2. Click "History" tab
3. See all past conversations
4. Click on one conversation
5. Verify past messages load
6. Send a new reply
7. Verify admin sees it

**Expected Results**:
```
✅ History tab shows all conversations
✅ Each shows last message preview
✅ Unread badge appears if messages unread
✅ Clicking loads full conversation
✅ Can send new messages
✅ Admin sees new messages in real-time
```

**UI Elements**:
- History toggle button in chat header
- List of conversations with timestamps
- "Continue conversation" button
- Message count badge

**If Failed**:
- Check GET /api/chat/conversations endpoint
- Verify userId matches in Firestore
- Check browser localStorage for user ID
- Verify adminChatButton.js changes deployed

---

### Test 5: Rate Limiting (10 min)

**Purpose**: Verify spam protection without blocking admins

**Test A: Message Rate Limit (20 per 15 min)**
```bash
# As regular user, send 20 messages rapidly
# Message 21: Should get 429 error
# Error response: { error: "Too many requests", retryAfter: 900 }
```

**Expected**:
```
✅ Messages 1-20: 200 OK
✅ Message 21: 429 Too Many Requests
✅ Retry-After header: 900 seconds
```

**Test B: Conversation Rate Limit (5 per hour)**
```bash
# As regular user, create 5 NEW conversations
# Conversation 6: Should get 429 error
```

**Expected**:
```
✅ Conversations 1-5: 201 Created
✅ Conversation 6: 429 Too Many Requests
```

**Test C: Admin Bypass (no rate limits)**
```bash
# Log in as admin user
# Send 50 messages rapidly
# All should return 200 OK (no 429 errors)
```

**Expected**:
```
✅ Admin can send unlimited messages
✅ Admin can create unlimited conversations
✅ No rate limit errors for admin
```

**Verify in Code**:
```javascript
// backend/server.js lines 372-405
// chatRateLimit: 20 per 15 min (skips admins)
// chatConversationRateLimit: 5 per hour
```

**If Failed**:
- Check rate limit values in backend/server.js
- Verify admin detection (role == 'admin')
- Test with different user roles
- Check X-RateLimit headers in response

---

### Test 6: Auto-Archive Inactive Conversations (10 min)

**Purpose**: Verify old conversations clean up automatically

**Manual Test** (since auto-archive runs daily):
```bash
# In Firestore, find a conversation
# Set updatedAt to 31 days ago (older than 30-day threshold)
# Manually call the archive function

# Via API:
curl -X POST https://[backend]/api/admin/chat/archive-inactive \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -H "Content-Type: application/json"

# Should return:
# { archivedCount: 1, success: true }
```

**Expected Results**:
```
✅ Conversations inactive 30+ days get status='archived'
✅ Archived conversations hidden from active list
✅ Can still view archived (filter toggle)
✅ Database cleanup working
```

**Verify in Code**:
```javascript
// backend/models/Chat.js
// autoArchiveInactiveConversations(30)
// getPendingAutoArchive(28) for 2-day warning
```

**If Failed**:
- Check conversation.updatedAt timestamp
- Verify auto-archive function is implemented
- Check Firestore indexes for query
- Verify status field changes to 'archived'

---

### Test 7: Performance Baseline (5 min)

**Purpose**: Ensure staging performs well

**Measurements**:
```
Metric              Expected        Actual      ✅/❌
─────────────────────────────────────────────────────
Page Load Time      < 3 sec         ___         
First Paint         < 2 sec         ___
Main Bundle Size    < 400 kB gzip   311.4 kB    ✅
API Response Time   < 1 sec         ___
Socket Connect      < 2 sec         ___
Chat Open Time      < 1 sec         ___
```

**How to Measure**:
1. Open DevTools → Network tab
2. Reload page
3. Check "Slow 3G" in DevTools
4. Record timings

**If Failed**:
- Check Network tab for slow requests
- Look for large JS chunks taking time
- Verify API endpoints responding fast
- Check backend logs for delays

---

## Summary: Test Results

After running all 7 tests above, fill in this summary:

```
Test 1: Socket.IO Real-Time          [✅ PASS / ❌ FAIL]
Test 2: Canned Responses CRUD        [✅ PASS / ❌ FAIL]
Test 3: Email Notifications          [✅ PASS / ❌ FAIL]
Test 4: Chat History                 [✅ PASS / ❌ FAIL]
Test 5: Rate Limiting                [✅ PASS / ❌ FAIL]
Test 6: Auto-Archive                 [✅ PASS / ❌ FAIL]
Test 7: Performance                  [✅ PASS / ❌ FAIL]

Overall: [✅ ALL PASS / ⚠️ SOME ISSUES / ❌ BLOCKING ISSUES]
```

---

## If Tests Fail

### Critical Issues (Block Production)
- Socket.IO not connecting
- Email not sending at all
- Rate limiting broken
- Canned responses not working

**Action**: Fix and rerun tests before production

### Non-Critical Issues (Fix Later)
- Performance slower than expected
- Minor UI glitches
- Console warnings

**Action**: Log issue, can go to production with plan to fix

---

## Next Steps After Staging

1. **Admin Team Review** (30 min)
   - Show admin team the staging environment
   - Get feedback on canned responses wording
   - Verify email template looks good
   - Check Socket.IO reliability

2. **Fix Issues Found** (variable time)
   - Apply fixes to code
   - Rebuild frontend
   - Redeploy to staging
   - Retest

3. **Approve for Production** (go/no-go decision)
   - Staging all tests pass: ✅
   - Admin team approves: ✅
   - No critical issues: ✅
   - Ready for production: ✅

4. **Deploy to Production** (when approved)
   - Follow LIVE_CHAT_FIXES_DEPLOYMENT.md
   - Same process as staging
   - Monitor first 24 hours
   - Gather user feedback

---

## Rollback Plan (If Needed)

If critical issue found on staging:

```bash
# Step 1: Revert code
git revert HEAD~1  # Reverts the chat fixes commit
git push origin main

# Step 2: Rebuild and redeploy
npm run build
firebase deploy --only hosting

# Step 3: Verify
# - Staging shows old version
# - Chat works (but without new features)
# - No errors

# Timeline: 10-15 minutes
# Result: Old version back online while we fix issues
```

---

## Success Criteria for Staging Approval

✅ **Required** (All must be YES):
- [ ] All 7 tests pass
- [ ] No console errors
- [ ] No critical logs errors
- [ ] Admin team approves
- [ ] Performance acceptable
- [ ] Email working

✅ **Recommended** (Should be YES):
- [ ] Tested by multiple admins
- [ ] Mobile browser tested
- [ ] Dark mode tested (if applicable)
- [ ] Edge cases tested

If all ✅ boxes checked: **APPROVED FOR PRODUCTION** 🚀

---

## Contact & Support

**Issues during testing?**
- Check QUICK_REFERENCE.md "If Something Breaks" section
- Review LIVE_CHAT_CODE_IMPLEMENTATION.md API docs
- Check backend logs for errors
- Ask your team lead

**Ready for production?**
- Follow LIVE_CHAT_FIXES_DEPLOYMENT.md
- Same procedure as staging
- More careful monitoring (24 hours)

**Questions?**
- See LIVE_CHAT_FLOW_ANALYSIS.md for how system works
- See LIVE_CHAT_FIXES_IMPLEMENTED.md for what changed
- See LIVE_CHAT_CODE_IMPLEMENTATION.md for code details

---

**Good luck with staging deployment!** 🎯

Next: Execute Part 1-5 above, then report results in test summary.
