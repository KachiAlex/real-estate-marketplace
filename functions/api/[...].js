let app;

try {
  app = require('../../backend/app');
  console.log('[Serverless] Express app loaded successfully');
} catch (error) {
  console.error('[Serverless] Failed to load Express app:', error.message);
  module.exports = (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Failed to load Express app',
      details: error.message
    });
  };
}

// Vercel serverless function handler
if (app) {
  module.exports = (req, res) => {
    // Set environment for serverless
    process.env.DISABLE_SOCKETS = 'true';
    process.env.VERCEL = '1';
    
    // Log incoming request for debugging
    console.log(`[Serverless] ${req.method} ${req.url}`);
    
    // Handle the request with the Express app
    try {
      return app(req, res);
    } catch (error) {
      console.error('[Serverless] Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: error.message
        });
      }
    }
  };
}
