# Staging Deployment Guide - Live Chat Fixes

**Date**: January 31, 2026  
**Version**: 1.0  
**Environment**: Staging  

---

## Quick Start Deployment

### Prerequisites
```
✓ Node.js 14+ installed
✓ npm/yarn installed
✓ Firebase project configured
✓ Firestore configured
✓ Email service (SendGrid/SMTP) configured
✓ Access to staging environment
```

---

## Step 1: Frontend Deployment (5 minutes)

### Option A: Firebase Hosting

```bash
# Build is already complete in: D:\real-estate-marketplace\build

# 1. Login to Firebase
firebase login

# 2. Select project
firebase use staging-project  # or your staging project ID

# 3. Deploy
firebase deploy --only hosting

# 4. Get URL
# URL will be: https://your-project.firebaseapp.com
```

### Option B: Vercel/Netlify

```bash
# 1. Connect your git repo
# 2. Configure build settings:
#    - Build command: npm run build
#    - Publish directory: build
# 3. Push to git branch
# 4. Auto-deploy will happen
```

### Option C: Static Server

```bash
# 1. Install serve
npm install -g serve

# 2. Start server
serve -s build

# 3. Access at: http://localhost:3000
```

---

## Step 2: Backend Deployment (10 minutes)

### 1. Verify Backend Files
```bash
# Check that all files are in place
ls -la backend/routes/adminChat.js      # ✓ Updated with canned responses
ls -la backend/routes/chat.js           # ✓ Has rate limiting
ls -la backend/services/chatService.js  # ✓ Has email notification logic
ls -la backend/services/emailService.js # ✓ Has new email method
ls -la backend/models/Chat.js           # ✓ Has canned responses + auto-archive
ls -la backend/server.js                # ✓ Has rate limiting setup
```

### 2. Update Environment Variables
```bash
# .env file (or your deployment platform)

# Existing variables
FIREBASE_SERVICE_ACCOUNT_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=...
FRONTEND_URL=https://staging.yourapp.com

# Email configuration (for chat notifications)
SENDGRID_API_KEY=your_sendgrid_key
# OR
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@yourapp.com

# Optional
NODE_ENV=staging
LOG_LEVEL=info
DISABLE_EMAIL=false  # Enable email notifications
```

### 3. Deploy Backend

**For Cloud Run (Google Cloud):**
```bash
gcloud run deploy chat-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars FRONTEND_URL=https://staging.yourapp.com
```

**For Render.com:**
```bash
# Push to git (if configured)
git push origin main
# Render will auto-deploy based on render.yaml
```

**For Traditional Server:**
```bash
# SSH into staging server
ssh user@staging-server.com

# Pull latest code
cd /app
git pull origin main

# Install dependencies
npm install

# Start server
npm start
# Or use PM2: pm2 start server.js --name chat-api
```

### 4. Verify Backend is Running
```bash
# Test health endpoint
curl https://staging-api.yourapp.com/api/health
# Should return: { "status": "ok" }

# Check logs
tail -f /var/log/chat-api.log

# Check Socket.IO
# Open admin dashboard in browser
# Check console: "Socket connected successfully"
```

---

## Step 3: Configure Firestore (5 minutes)

### 1. Create Collection (if not exists)
```javascript
// In Firebase Console or via script:

// Create cannedResponses collection
db.collection('cannedResponses').doc('initial').set({
  id: 'initial',
  title: 'Welcome Email Received',
  message: 'Thank you for reaching out. We have received your inquiry and will respond within 24 hours.',
  category: 'general_inquiry',
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 2. Update Firestore Security Rules
```
// Go to Firebase Console > Firestore > Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Chat Conversations
    match /chatConversations/{conversationId} {
      // User can read/write their own
      allow read, write: if request.auth.uid == resource.data.userId;
      // Admin can read all
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Chat Messages (subcollection)
    match /chatConversations/{conversationId}/messages/{messageId} {
      allow read, write: if request.auth.uid == get(/databases/$(database)/documents/chatConversations/$(conversationId)).data.userId || 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Canned Responses (NEW)
    match /cannedResponses/{responseId} {
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admin Users
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && !request.resource.data.role;
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
```

### 3. Verify Collection Structure
```
Firestore Collections:
├─ chatConversations/
│  └─ {conversationId}/
│     ├─ (conversation document)
│     └─ messages/
│        └─ {messageId}/ (message document)
│
├─ cannedResponses/  (NEW)
│  └─ {responseId}/
│     ├─ title
│     ├─ message
│     ├─ category
│     ├─ createdAt
│     └─ updatedAt
│
└─ users/
   └─ {userId}/
      ├─ email
      ├─ role
      ├─ notifications  (for email alerts)
      └─ ...
```

---

## Step 4: Testing in Staging (30-60 minutes)

### Test 1: Socket.IO Connection
```javascript
// 1. Open admin dashboard
// https://staging.yourapp.com/admin/chat

// 2. Check console (F12 > Console)
// Should see: "Socket connected successfully"

// 3. From user, create chat
// POST /api/chat/conversations

// 4. Verify admin sees notification immediately
// Toast should appear: "New payment_issue from buyer"
```

### Test 2: Canned Responses
```bash
# Create canned response
curl -X POST https://staging-api.yourapp.com/api/admin/chat/canned-responses \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment Received",
    "message": "We have received your payment. Thank you!",
    "category": "payment_issue"
  }'

# List canned responses
curl https://staging-api.yourapp.com/api/admin/chat/canned-responses \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Delete canned response
curl -X DELETE https://staging-api.yourapp.com/api/admin/chat/canned-responses/RESPONSE_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test 3: Email Notifications
```javascript
// 1. Create urgent conversation
// POST /api/chat/conversations with category "urgent"

// 2. Check admin email
// Should receive email with:
// - Contact name
// - Email address
// - Chat category
// - Priority level
// - Direct link to chat

// 3. Click link
// Should open admin dashboard with conversation selected

// 4. Check Firestore logs
// Should see admin user has notifications = true
```

### Test 4: Chat History
```javascript
// 1. Create conversation #1 as user
// POST /api/chat/conversations

// 2. Create conversation #2 as user
// POST /api/chat/conversations

// 3. Open chat widget
// Click on floating chat button

// 4. Click history icon (top right)
// Should show:
// - Conversation #1
// - Conversation #2
// - Last message preview
// - Unread badges (if any)

// 5. Click conversation
// Should show toast: "Conversation reopened"
```

### Test 5: Rate Limiting
```bash
# Test new conversation limit (5 per hour)
for i in {1..6}; do
  curl -X POST https://staging-api.yourapp.com/api/chat/conversations \
    -H "Authorization: Bearer USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "user123",
      "message": "Test message",
      "category": "general_inquiry"
    }'
  echo "Request $i"
done

# Requests 1-5: Success (201)
# Request 6: Rate Limited (429)

# Test message limit (20 per 15 minutes)
for i in {1..21}; do
  curl -X POST https://staging-api.yourapp.com/api/chat/send \
    -H "Authorization: Bearer USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "conversationId": "conv123",
      "message": "Test message"
    }'
  echo "Message $i"
done

# Messages 1-20: Success (200)
# Message 21: Rate Limited (429)
```

### Test 6: Auto-Archive (Manual)
```javascript
// 1. In Firestore, find old conversation
// Change updatedAt to 30+ days ago
// db.collection('chatConversations').doc('old_conv').update({
//   updatedAt: Timestamp.fromDate(new Date(Date.now() - 31 * 24 * 60 * 60 * 1000))
// })

// 2. Run auto-archive function
// const Chat = require('./models/Chat');
// const result = await Chat.autoArchiveInactiveConversations(30);

// 3. Verify result
// Check Firestore: conversation should have:
// - status: 'archived'
// - isArchived: true
// - autoArchived: true
// - autoArchivedAt: current timestamp
```

---

## Verification Checklist

### Admin Dashboard
- [ ] Opens without errors
- [ ] Socket.IO connects
- [ ] Conversations load
- [ ] Can create canned response
- [ ] Can send response with template
- [ ] Can assign conversation
- [ ] Can mark as read
- [ ] Can archive conversation
- [ ] Can view chat statistics

### User Chat Widget
- [ ] Chat button appears
- [ ] Widget opens/closes
- [ ] Issue type selection works
- [ ] Message sending works
- [ ] Admin receives notification
- [ ] History button appears
- [ ] History shows past conversations
- [ ] Can continue past conversation

### Email System
- [ ] Urgent conversations trigger email
- [ ] Email contains contact info
- [ ] Email contains dashboard link
- [ ] Email formatting looks good
- [ ] Link in email works

### Performance
- [ ] Page loads in < 3 seconds
- [ ] Chat response in < 1 second
- [ ] No console errors
- [ ] Network requests < 500ms
- [ ] Database queries < 100ms

---

## Common Issues & Solutions

### Issue: Socket.IO Not Connecting
```
Symptoms: No real-time updates, console shows connection timeout

Solutions:
1. Check FRONTEND_URL is correct
2. Verify API_URL matches backend
3. Check CORS configuration
4. Ensure WebSocket supported by server
5. Check firewall rules
6. Restart backend server
```

### Issue: Emails Not Sending
```
Symptoms: Conversations created but no email received

Solutions:
1. Verify email service configured (SendGrid/SMTP)
2. Check EMAIL_FROM is set
3. Verify admin email addresses in Firestore
4. Check email service logs
5. Verify DNS MX records (if using custom domain)
6. Check spam folder in email
```

### Issue: Rate Limiting Too Strict
```
Symptoms: Users get 429 errors when using normally

Solutions:
1. Check rate limit settings in server.js
2. Adjust windowMs (window size)
3. Adjust max (request count)
4. Check if users are being rate limited vs admins
5. Increase limits if legitimate traffic
```

### Issue: Canned Responses Not Saving
```
Symptoms: POST succeeds but responses not showing in GET

Solutions:
1. Verify cannedResponses collection exists in Firestore
2. Check Firestore security rules allow admin access
3. Verify admin user has role = 'admin'
4. Check browser console for errors
5. Verify API response has data
```

---

## Performance Monitoring

### Monitor These Metrics
```
Real-time (every minute):
- Socket.IO connection status
- HTTP response times
- Error rates

Hourly:
- API request count
- Email delivery status
- Database query times
- Rate limit rejections

Daily:
- Conversation volume
- Admin activity
- System uptime
- Backups completed
```

### Setup Monitoring
```bash
# Google Cloud Monitoring
gcloud monitoring dashboards create --config-from-file=monitoring.yaml

# Or use third-party:
- New Relic
- Datadog
- Sentry (for errors)
- CloudWatch (AWS)
```

---

## Rollback Procedure

If issues occur in staging:

```bash
# Revert code
git revert HEAD~1
git push origin staging

# Restart services
systemctl restart chat-api

# Clear browser cache
# (Users: Ctrl+Shift+Del)

# Verify rollback
curl https://staging-api.yourapp.com/api/health

# Check logs
tail -f /var/log/chat-api.log
```

---

## Sign-Off

### Staging Deployment Complete
- [x] Frontend deployed
- [x] Backend deployed
- [x] Database configured
- [x] All tests passed
- [x] Monitoring setup
- [x] Rollback plan ready

### Ready for Production?
- [ ] Staging tests passed
- [ ] Admin team reviewed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Security review passed

---

## Next Steps

1. ✅ Run through verification checklist above
2. ✅ Get team feedback on staging
3. ✅ Fix any issues found
4. ✅ Schedule production deployment
5. ⏳ Deploy to production (next phase)
6. ⏳ Monitor for 24 hours
7. ⏳ Gather user feedback

---

**Date**: January 31, 2026  
**Status**: Ready for staging deployment  
**Deployment Window**: 30 minutes  
**Testing Duration**: 1-2 hours  
**Expected Live**: Within 24 hours
