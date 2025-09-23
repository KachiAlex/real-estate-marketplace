const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Minimal function only to verify cold start
exports.health = functions.https.onRequest((req, res) => {
  res.status(200).send('ok');
});
