const helmet = require('helmet');

// Security configuration
const securityConfig = {
  // Helmet configuration for security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: ["'self'", 'https://api.cloudinary.com', 'https://api-kzs3jdpe7a-uc.a.run.app'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https://res.cloudinary.com'],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://propertyark.com',
        'https://www.propertyark.com',
        'https://real-estate-marketplace-37544.web.app',
        'https://real-estate-marketplace-37544.firebaseapp.com'
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow Firebase hosting domains (web.app and firebaseapp.com)
      const isFirebaseHosting = origin && (
        origin.includes('.web.app') || 
        origin.includes('.firebaseapp.com')
      );

      // In production, always allow Firebase hosting domains
      if (process.env.NODE_ENV === 'production' && isFirebaseHosting) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1 || isFirebaseHosting || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        // Log for debugging but still allow in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('CORS: Origin not in allowed list but allowing in dev:', origin);
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
  },

  // Input sanitization patterns
  sanitization: {
    // XSS prevention patterns
    xssPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ],

    // SQL injection prevention patterns (for MongoDB)
    sqlPatterns: [
      /(\$where|\$regex|\$ne|\$gt|\$gte|\$lt|\$lte)/gi,
    ],

    // File path traversal patterns
    pathTraversalPatterns: [
      /\.\.\//g,
      /\.\.\\+/g,
    ]
  },

  // Allowed file types
  allowedFileTypes: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    videos: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    mortgageDocument: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png']
  },

  // File size limits (in bytes)
  fileSizeLimits: {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    document: 10 * 1024 * 1024, // 10MB
    avatar: 5 * 1024 * 1024, // 5MB
  }
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  let sanitized = input;
  
  // Remove XSS patterns
  securityConfig.sanitization.xssPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove potential MongoDB injection patterns
  securityConfig.sanitization.sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove path traversal patterns
  securityConfig.sanitization.pathTraversalPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

// Recursively sanitize object
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

// Validate file type
const isValidFileType = (mimetype, category) => {
  const allowedTypes = securityConfig.allowedFileTypes[category] || [];
  return allowedTypes.includes(mimetype);
};

// Validate file size
const isValidFileSize = (size, category) => {
  const maxSize = securityConfig.fileSizeLimits[category] || securityConfig.fileSizeLimits.document;
  return size <= maxSize;
};

module.exports = {
  securityConfig,
  sanitizeInput,
  sanitizeObject,
  isValidFileType,
  isValidFileSize
};


