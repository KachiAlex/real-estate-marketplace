const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Inspection request trigger (simplified without FCM for now)
exports.onInspectionRequestWrite = functions.firestore
  .document('inspectionRequests/{requestId}')
  .onWrite(async (change, context) => {
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      if (!after) return; // deleted

      console.log('Inspection request updated:', {
        requestId: context.params.requestId,
        before: before?.status,
        after: after?.status,
        buyerId: after.buyerId,
        vendorId: after.vendorId
      });

      // TODO: Add FCM notifications here once functions are stable
    } catch (e) {
      console.error('onInspectionRequestWrite error:', e);
    }
  });

// Health check function
exports.health = functions.https.onRequest((req, res) => {
  res.status(200).send('ok');
});