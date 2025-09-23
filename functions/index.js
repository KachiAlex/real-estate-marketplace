const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Flutterwave payment verification (TEMP disabled for deploy isolation)
// exports.verifyPayment = functions.https.onCall(async (data, context) => {
  try {
    const { transaction_id, tx_ref, status } = data;

    if (!transaction_id || !tx_ref || !status) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    // Find escrow transaction by Flutterwave reference
    const escrowQuery = await db.collection('escrow')
      .where('flutterwaveReference', '==', tx_ref)
      .limit(1)
      .get();

    if (escrowQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Escrow transaction not found');
    }

    const escrowDoc = escrowQuery.docs[0];
    const escrowData = escrowDoc.data();

    if (status === 'successful') {
      // Update escrow transaction status
      const confirmationDeadline = new Date();
      confirmationDeadline.setDate(confirmationDeadline.getDate() + 7); // 7 days from now

      await escrowDoc.ref.update({
        status: 'funded',
        flutterwaveTransactionId: transaction_id,
        paymentDate: admin.firestore.FieldValue.serverTimestamp(),
        confirmationDeadline: admin.firestore.Timestamp.fromDate(confirmationDeadline),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send notifications to buyer and seller
      await sendNotification(escrowData.buyerId, {
        title: 'Payment Successful',
        message: `Your payment of ₦${escrowData.amount.toLocaleString()} has been received and is now in escrow.`,
        type: 'payment_success'
      });

      await sendNotification(escrowData.sellerId, {
        title: 'Payment Received',
        message: `Payment of ₦${escrowData.amount.toLocaleString()} has been received for ${escrowData.propertyTitle}.`,
        type: 'payment_received'
      });

      return {
        success: true,
        message: 'Payment verified successfully',
        data: {
          escrow_id: escrowDoc.id,
          status: 'funded',
          transaction_id,
          confirmation_deadline: confirmationDeadline
        }
      };
    } else {
      // Payment failed
      await escrowDoc.ref.update({
        status: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: false,
        message: 'Payment verification failed',
        data: {
          escrow_id: escrowDoc.id,
          status: 'failed'
        }
      };
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new functions.https.HttpsError('internal', 'Payment verification failed');
  }
// });

// Auto-release escrow funds after 7 days
// exports.autoReleaseEscrow = functions.https.onRequest(async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Find escrow transactions that are past their confirmation deadline
    const expiredEscrows = await db.collection('escrow')
      .where('status', '==', 'in_escrow')
      .where('confirmationDeadline', '<=', now)
      .where('autoReleaseTriggered', '==', false)
      .get();

    const batch = db.batch();
    const notifications = [];

    expiredEscrows.forEach(doc => {
      const escrowData = doc.data();
      
      // Update escrow status to auto-released
      batch.update(doc.ref, {
        status: 'auto_released',
        autoReleaseTriggered: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Prepare notifications
      notifications.push({
        userId: escrowData.buyerId,
        notification: {
          title: 'Funds Auto-Released',
          message: `Funds for ${escrowData.propertyTitle} have been automatically released to the vendor.`,
          type: 'auto_release',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });

      notifications.push({
        userId: escrowData.sellerId,
        notification: {
          title: 'Funds Released',
          message: `Funds of ₦${escrowData.amount.toLocaleString()} have been released to your account.`,
          type: 'funds_released',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    });

    // Commit batch update
    await batch.commit();

    // Send notifications
    for (const notif of notifications) {
      await sendNotification(notif.userId, notif.notification);
    }

    console.log(`Auto-released ${expiredEscrows.size} escrow transactions`);
    res.status(200).json({ 
      success: true, 
      message: `Auto-released ${expiredEscrows.size} escrow transactions` 
    });
  } catch (error) {
    console.error('Auto-release error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
// });

// Confirm property possession
// exports.confirmProperty = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { escrowId, confirmationData } = data;

    if (!escrowId || !confirmationData) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const escrowRef = db.collection('escrow').doc(escrowId);
    const escrowDoc = await escrowRef.get();

    if (!escrowDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Escrow transaction not found');
    }

    const escrowData = escrowDoc.data();

    // Verify user is the buyer
    if (escrowData.buyerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the buyer can confirm property possession');
    }

    // Update escrow status
    await escrowRef.update({
      status: 'buyer_confirmed',
      confirmationData: confirmationData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to seller
    await sendNotification(escrowData.sellerId, {
      title: 'Property Confirmed',
      message: `The buyer has confirmed possession of ${escrowData.propertyTitle}. Funds will be released shortly.`,
      type: 'property_confirmed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Property possession confirmed successfully'
    };
  } catch (error) {
    console.error('Property confirmation error:', error);
    throw new functions.https.HttpsError('internal', 'Property confirmation failed');
  }
// });

// File dispute
// exports.fileDispute = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { escrowId, disputeData } = data;

    if (!escrowId || !disputeData) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const escrowRef = db.collection('escrow').doc(escrowId);
    const escrowDoc = await escrowRef.get();

    if (!escrowDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Escrow transaction not found');
    }

    const escrowData = escrowDoc.data();

    // Verify user is the buyer
    if (escrowData.buyerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the buyer can file a dispute');
    }

    // Update escrow status
    await escrowRef.update({
      status: 'disputed',
      disputeData: disputeData,
      disputeDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to admin
    await sendNotification('admin', {
      title: 'New Dispute Filed',
      message: `A dispute has been filed for ${escrowData.propertyTitle} by ${escrowData.buyerName}.`,
      type: 'dispute_filed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Dispute filed successfully'
    };
  } catch (error) {
    console.error('Dispute filing error:', error);
    throw new functions.https.HttpsError('internal', 'Dispute filing failed');
  }
// });

// Helper function to send notifications
async function sendNotification(userId, notification) {
  try {
    if (userId === 'admin') {
      // Send to all admin users
      const adminUsers = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
      
      const batch = db.batch();
      adminUsers.forEach(doc => {
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
          ...notification,
          userId: doc.id,
          read: false
        });
      });
      await batch.commit();
    } else {
      // Send to specific user
      const notifRef = db.collection('notifications').doc();
      await notifRef.set({
        ...notification,
        userId: userId,
        read: false
      });
    }
  } catch (error) {
    console.error('Notification sending error:', error);
  }
}

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

// exports.onInspectionRequestWrite = functions.firestore
//   .document('inspectionRequests/{requestId}')
//   .onWrite(async (change, context) => {
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
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
            requestId: context.params.requestId || ''
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
            data: { type: 'inspection_accepted', requestId: context.params.requestId || '' }
          });
        } else if (after.status === 'proposed_new_time') {
          await sendFcmToUser(buyerId, {
            notification: {
              title: 'Vendor Proposed New Time',
              body: `${projectName}: ${after.proposedDate || ''} ${after.proposedTime || ''}`
            },
            data: { type: 'inspection_proposed', requestId: context.params.requestId || '' }
          });
        } else if (after.status === 'declined') {
          await sendFcmToUser(buyerId, {
            notification: {
              title: 'Inspection Declined',
              body: `${projectName}`
            },
            data: { type: 'inspection_declined', requestId: context.params.requestId || '' }
          });
        }
      }
    } catch (e) {
      console.error('onInspectionRequestWrite error:', e);
    }
//   });

// Lightweight health check HTTP function to ensure cold start loads succeed
exports.health = functions.https.onRequest((req, res) => {
  res.status(200).send('ok');
});

// Property verification trigger
// exports.onPropertyCreate = functions.firestore
//   .document('properties/{propertyId}')
//   .onCreate(async (snap, context) => {
    try {
      const propertyData = snap.data();
      
      // Send notification to admin for property verification
      await sendNotification('admin', {
        title: 'New Property Pending Verification',
        message: `A new property "${propertyData.title}" has been submitted for verification.`,
        type: 'property_pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`New property created: ${context.params.propertyId}`);
    } catch (error) {
      console.error('Property creation trigger error:', error);
    }
//   });

// User registration trigger
// exports.onUserCreate = functions.firestore
//   .document('users/{userId}')
//   .onCreate(async (snap, context) => {
    try {
      const userData = snap.data();
      
      // Send welcome notification
      await sendNotification(context.params.userId, {
        title: 'Welcome to Naija Luxury Homes!',
        message: 'Thank you for joining our platform. Start exploring amazing properties today!',
        type: 'welcome',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`New user registered: ${context.params.userId}`);
    } catch (error) {
      console.error('User creation trigger error:', error);
    }
//   });
