const functions = require('firebase-functions/v1');

// Minimal health check function with no dependencies
exports.health = functions.https.onRequest((req, res) => {
  res.status(200).send('ok');
});