const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Real Estate API is running',
    timestamp: new Date().toISOString()
  });
});

// Properties endpoints
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

// Property approval
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

// Property rejection
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

// Notifications
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

// Chat
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

// Rating
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

// Inspection Request endpoints
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

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);