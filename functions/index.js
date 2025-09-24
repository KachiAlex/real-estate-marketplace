const { onRequest } = require('firebase-functions/v2/https');

// Minimal health check function with no dependencies
exports.health = onRequest((req, res) => {
  res.status(200).send('ok');
});