const express = require('express');
const router = express.Router();

// GET /api/config/firebase
// Returns runtime Firebase config only if environment variables are present.
router.get('/firebase', (req, res) => {
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || null;
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null;
  const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || null;
  const storageBucket = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || null;
  const messagingSenderId = process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || null;
  const appId = process.env.REACT_APP_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || null;
  const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || null;

  if (!apiKey) {
    return res.status(204).end();
  }

  return res.json({
    apiKey,
    projectId,
    authDomain,
    storageBucket,
    messagingSenderId,
    appId,
    vapidKey
  });
});

// GET /api/config/db-check
// Returns basic DB connectivity info for debugging (non-destructive)
router.get('/db-check', async (req, res) => {
  try {
    const { User } = require('../config/sequelizeDb');
    if (!User) {
      return res.status(500).json({ success: false, message: 'User model not available' });
    }

    // Do a simple count to verify DB connectivity
    const count = await User.count();
    return res.json({ success: true, message: 'DB reachable', userCount: count });
  } catch (err) {
    console.error('DB check error:', err);
    const payload = { success: false, message: 'DB check failed', error: err.message };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    return res.status(500).json(payload);
  }
});

module.exports = router;
