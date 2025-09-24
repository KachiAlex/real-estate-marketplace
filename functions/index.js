const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Helper function to send FCM notifications
async function getUserFcmTokens(userId) {
  try {
    const doc = await db.collection('userFcmTokens').doc(userId).get();
    if (!doc.exists) return [];
    const data = doc.data();
    const tokens = Array.isArray(data?.tokens) ? data.tokens.filter(Boolean) : [];
    return tokens;
  } catch (e) {
    console.error('Error fetching FCM tokens for', userId, e);
    return [];
  }
}

async function sendFcmToUser(userId, payload) {
  try {
    const tokens = await getUserFcmTokens(userId);
    if (!tokens.length) return { successCount: 0 };
    const response = await messaging.sendEachForMulticast({ tokens, ...payload });
    return { successCount: response.successCount };
  } catch (e) {
    console.error('Error sending FCM to user', userId, e);
    return { successCount: 0 };
  }
}

// Inspection request trigger for FCM notifications
exports.onInspectionRequestWrite = onDocumentWritten('inspectionRequests/{requestId}', async (event) => {
  try {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return; // deleted

    const buyerId = after.buyerId;
    const vendorId = after.vendorId;
    const projectName = after.projectName || 'Property';

    // New request
    if (!before) {
      await sendFcmToUser(vendorId, {
        notification: {
          title: 'New Inspection Request',
          body: `${after.buyerName || 'A buyer'} requested to view ${projectName}`
        },
        data: {
          type: 'inspection_new',
          requestId: event.params.requestId || ''
        }
      });
      return;
    }

    // Status changes
    if (before.status !== after.status) {
      if (after.status === 'accepted') {
        await sendFcmToUser(buyerId, {
          notification: {
            title: 'Inspection Confirmed',
            body: `${projectName} on ${after.confirmedDate || ''} ${after.confirmedTime || ''}`
          },
          data: { type: 'inspection_accepted', requestId: event.params.requestId || '' }
        });
      } else if (after.status === 'proposed_new_time') {
        await sendFcmToUser(buyerId, {
          notification: {
            title: 'Vendor Proposed New Time',
            body: `${projectName}: ${after.proposedDate || ''} ${after.proposedTime || ''}`
          },
          data: { type: 'inspection_proposed', requestId: event.params.requestId || '' }
        });
      } else if (after.status === 'declined') {
        await sendFcmToUser(buyerId, {
          notification: {
            title: 'Inspection Declined',
            body: `${projectName}`
          },
          data: { type: 'inspection_declined', requestId: event.params.requestId || '' }
        });
      }
    }
  } catch (e) {
    console.error('onInspectionRequestWrite error:', e);
  }
});

// Health check function
exports.health = onRequest((req, res) => {
  res.status(200).send('ok');
});
