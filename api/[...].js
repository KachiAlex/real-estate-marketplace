const { parse: parseUrl } = require('url');

// Set serverless env BEFORE requiring app so middleware conditionals work at load time
process.env.VERCEL = '1';
process.env.DISABLE_SOCKETS = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

let app;
let loadError;

try {
  app = require('./backend/app');
  console.log('[Serverless] Express app loaded successfully');
} catch (error) {
  loadError = error;
  console.error('[Serverless] Failed to load Express app:', error.message);
  console.error('[Serverless] Stack:', error.stack);
}

module.exports = (req, res) => {
  const parsed = parseUrl(req.url, true);
  const originalUrl = req.originalUrl || req.url;

  // Temporary diagnostics to understand how Vercel forwards rewritten paths
  if (process.env.VERCEL) {
    const debugHeaders = {
      url: req.url,
      originalUrl: req.originalUrl,
      queryPath: parsed.query?.path,
      'x-now-route-matches': req.headers['x-now-route-matches'],
      'x-vercel-proxied-path': req.headers['x-vercel-proxied-path'],
      'x-vercel-forwarded-for': req.headers['x-vercel-forwarded-for']
    };
    console.log('[Serverless][PathDebug]', debugHeaders);
  }

  if (parsed.query && parsed.query.path) {
    const normalized = Array.isArray(parsed.query.path)
      ? parsed.query.path.join('/')
      : parsed.query.path;
    if (normalized) {
      const decoded = decodeURIComponent(normalized);
      req.url = `/api/${decoded}`;
      req.originalUrl = req.url;
    }
  }

  console.log(`[Serverless] ${req.method} ${req.url} (original: ${originalUrl})`);

  if (loadError || !app) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load Express app',
      details: loadError ? loadError.message : 'App not initialized',
      stack: loadError ? loadError.stack : undefined
    });
  }

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
