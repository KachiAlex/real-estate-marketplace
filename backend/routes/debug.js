const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const router = express.Router();

// Public debug endpoint to inspect Authorization header and token verification
// NOTE: Temporary and intended for debugging only. Remove after use.
router.get('/auth-check', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || null;
    const result = {
      hasAuthHeader: !!authHeader,
      authHeaderType: null,
      backendJwt: { verified: false, error: null },
      firebaseIdToken: { verified: false, error: null, uid: null, email: null }
    };

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      result.authHeaderType = 'Bearer';

      // Try backend JWT verify
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        result.backendJwt.verified = true;
        result.backendJwt.decoded = { id: decoded.id };
      } catch (err) {
        result.backendJwt.error = err.message || String(err);
      }

      // Try Firebase ID token verification
      try {
        const claims = await admin.auth().verifyIdToken(token);
        result.firebaseIdToken.verified = true;
        result.firebaseIdToken.uid = claims.uid || null;
        result.firebaseIdToken.email = claims.email || null;
      } catch (err) {
        result.firebaseIdToken.error = err.message || String(err);
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Debug auth-check error:', error);
    return res.status(500).json({ success: false, message: 'Debug failed', error: error.message });
  }
});

module.exports = router;
