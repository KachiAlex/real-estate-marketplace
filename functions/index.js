const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const log = (stage) => {
  console.log(`[bootstrap] ${new Date().toISOString()} - ${stage}`);
};

let appInstance = null;
let dbInstance = null;

const getDb = () => {
  if (!dbInstance) {
    log('Initializing Firebase Admin SDK');
    admin.initializeApp();
    log('Firebase Admin initialized');
    dbInstance = admin.firestore();
    log('Firestore reference ready');
  }
  return dbInstance;
};

const createApp = () => {
  log('Creating Express app');
  const app = express();
  const db = getDb();

  log('Registering middleware');
  app.use(cors({ origin: true }));
  app.use(express.json());

  log('Registering GET /api/health');
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Real Estate API is running',
      timestamp: new Date().toISOString()
    });
  });

  log('Registering GET /api/properties');
  app.get('/api/properties', async (req, res) => {
    try {
      const snapshot = await db.collection('properties').get();
      const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  });

  log('Registering PUT /api/properties/:id/approve');
  app.put('/api/properties/:id/approve', async (req, res) => {
    try {
      const propertyId = req.params.id;
      const propertyDoc = await db.collection('properties').doc(propertyId).get();
      if (!propertyDoc.exists) {
        return res.status(404).json({ error: 'Property not found' });
      }
      await db.collection('properties').doc(propertyId).update({
        approvalStatus: 'approved',
        isApproved: true,
        approvedAt: new Date().toISOString()
      });
      res.json({ message: 'Property approved' });
    } catch (error) {
      console.error('Error approving property:', error);
      res.status(500).json({ error: 'Failed to approve property' });
    }
  });

  log('Registering PUT /api/properties/:id/reject');
  app.put('/api/properties/:id/reject', async (req, res) => {
    try {
      const propertyId = req.params.id;
      const { rejectionReason } = req.body;
      const propertyDoc = await db.collection('properties').doc(propertyId).get();
      if (!propertyDoc.exists) {
        return res.status(404).json({ error: 'Property not found' });
      }
      await db.collection('properties').doc(propertyId).update({
        approvalStatus: 'rejected',
        isApproved: false,
        rejectionReason: rejectionReason || '',
        rejectedAt: new Date().toISOString()
      });
      res.json({ message: 'Property rejected' });
    } catch (error) {
      console.error('Error rejecting property:', error);
      res.status(500).json({ error: 'Failed to reject property' });
    }
  });

  log('Registering POST /api/notifications');
  app.post('/api/notifications', async (req, res) => {
    try {
      const notification = {
        ...req.body,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      const docRef = await db.collection('notifications').add(notification);
      res.json({ id: docRef.id, ...notification });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  log('Registering GET /api/notifications');
  app.get('/api/notifications', async (req, res) => {
    try {
      const { userId } = req.query;
      let ref = db.collection('notifications');
      if (userId) ref = ref.where('userId', '==', userId);
      const snapshot = await ref.orderBy('createdAt', 'desc').limit(50).get();
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  log('Registering POST /api/chats/start');
  app.post('/api/chats/start', async (req, res) => {
    try {
      const { buyerId, vendorId, propertyId, starterId, initialMessage } = req.body;
      const chatData = {
        buyerId,
        vendorId,
        propertyId,
        starterId,
        createdAt: new Date().toISOString(),
        messages: [{
          senderId: starterId,
          message: initialMessage,
          timestamp: new Date().toISOString()
        }]
      };
      const docRef = await db.collection('chats').add(chatData);
      res.json({ chatId: docRef.id, ...chatData });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ error: 'Failed to create chat' });
    }
  });

  log('Registering POST /api/ratings');
  app.post('/api/ratings', async (req, res) => {
    try {
      const rating = {
        ...req.body,
        createdAt: new Date().toISOString()
      };
      const docRef = await db.collection('ratings').add(rating);
      res.json({ id: docRef.id, ...rating });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ error: 'Failed to submit rating' });
    }
  });

  log('Registering POST /api/inspection-requests');
  app.post('/api/inspection-requests', async (req, res) => {
    try {
      const inspectionRequest = {
        ...req.body,
        createdAt: new Date().toISOString(),
        status: 'pending_vendor'
      };
      const docRef = await db.collection('inspectionRequests').add(inspectionRequest);
      res.json({ id: docRef.id, ...inspectionRequest });
    } catch (error) {
      console.error('Error creating inspection request:', error);
      res.status(500).json({ error: 'Failed to create inspection request' });
    }
  });

  log('Registering GET /api/inspection-requests');
  app.get('/api/inspection-requests', async (req, res) => {
    try {
      const { vendorId, buyerId } = req.query;
      let query = db.collection('inspectionRequests');

      if (vendorId) {
        query = query.where('vendorId', '==', vendorId);
      } else if (buyerId) {
        query = query.where('buyerId', '==', buyerId);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(requests);
    } catch (error) {
      console.error('Error fetching inspection requests:', error);
      res.status(500).json({ error: 'Failed to fetch inspection requests' });
    }
  });

  log('Registering PUT /api/inspection-requests/:id');
  app.put('/api/inspection-requests/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      await db.collection('inspectionRequests').doc(id).update(updates);
      res.json({ message: 'Inspection request updated successfully' });
    } catch (error) {
      console.error('Error updating inspection request:', error);
      res.status(500).json({ error: 'Failed to update inspection request' });
    }
  });

  log('Express app created');
  return app;
};

const getApp = () => {
  if (!appInstance) {
    log('Instantiating Express app');
    appInstance = createApp();
    log('Express app ready');
  }
  return appInstance;
};

exports.api = functions.https.onRequest((req, res) => {
  log('Incoming request received');
  const app = getApp();
  return app(req, res);
});