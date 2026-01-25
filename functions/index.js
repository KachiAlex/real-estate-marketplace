const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

if (!admin.apps.length) {
  admin.initializeApp();
  functions.logger.info('[functions] Firebase Admin initialized');
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const buildPropertyResponse = (doc) => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
  updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : doc.data().updatedAt
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is live',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/properties', async (req, res) => {
  try {
    const { status, verificationStatus } = req.query;
    let query = db.collection('properties');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (verificationStatus) {
      query = query.where('verificationStatus', '==', verificationStatus);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    const properties = snapshot.docs.map(buildPropertyResponse);

    res.json({ success: true, data: properties });
  } catch (error) {
    functions.logger.error('functions:properties:list', error);
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
});

app.put('/api/properties/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    if (!['approved', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const docRef = db.collection('properties').doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    await docRef.set({
      verificationStatus,
      approvalStatus: verificationStatus,
      verificationNotes: verificationNotes || '',
      isVerified: verificationStatus === 'approved',
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    const updated = await docRef.get();
    res.json({ success: true, data: buildPropertyResponse(updated) });
  } catch (error) {
    functions.logger.error('functions:properties:verify', error);
    res.status(500).json({ success: false, message: 'Failed to update property status' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdAt: FieldValue.serverTimestamp(),
      isRead: false
    };

    const docRef = await db.collection('notifications').add(payload);
    res.json({ success: true, data: { id: docRef.id, ...payload } });
  } catch (error) {
    functions.logger.error('functions:notifications:create', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = db.collection('notifications');

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, data });
  } catch (error) {
    functions.logger.error('functions:notifications:list', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found in Firebase Functions API' });
});

exports.api = functions.https.onRequest(app);