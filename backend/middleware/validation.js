const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  };
};

// Common validation rules
exports.userValidation = {
  create: [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('phone')
      .optional()
      .matches(/^(\+234|234|0)?[789][01]\d{8}$/)
      .withMessage('Please provide a valid Nigerian phone number'),
    
    body('role')
      .optional()
      .isIn(['user', 'agent', 'admin'])
      .withMessage('Role must be user, agent, or admin')
  ],

  update: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .matches(/^(\+234|234|0)?[789][01]\d{8}$/)
      .withMessage('Please provide a valid Nigerian phone number'),
    
    body('role')
      .optional()
      .isIn(['user', 'agent', 'admin'])
      .withMessage('Role must be user, agent, or admin')
  ]
};

exports.propertyValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Property title is required')
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Property description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    
    body('price')
      .isNumeric()
      .withMessage('Price must be a valid number')
      .isFloat({ min: 0 })
      .withMessage('Price must be positive'),
    
    body('type')
      .isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'])
      .withMessage('Invalid property type'),
    
    body('status')
      .optional()
      .isIn(['for-sale', 'for-rent', 'sold', 'rented'])
      .withMessage('Invalid property status'),
    
    body('location.address')
      .trim()
      .notEmpty()
      .withMessage('Address is required'),
    
    body('location.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    
    body('location.state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    
    body('details.bedrooms')
      .isInt({ min: 0 })
      .withMessage('Bedrooms must be a non-negative integer'),
    
    body('details.bathrooms')
      .isInt({ min: 0 })
      .withMessage('Bathrooms must be a non-negative integer'),
    
    body('details.sqft')
      .isNumeric()
      .withMessage('Square footage must be a valid number')
      .isFloat({ min: 0 })
      .withMessage('Square footage must be positive')
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    
    body('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a valid number')
      .isFloat({ min: 0 })
      .withMessage('Price must be positive'),
    
    body('type')
      .optional()
      .isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'])
      .withMessage('Invalid property type'),
    
    body('status')
      .optional()
      .isIn(['for-sale', 'for-rent', 'sold', 'rented'])
      .withMessage('Invalid property status')
  ]
};

exports.adminValidation = {
  settings: [
    body('verificationFee')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Verification fee must be a non-negative integer'),
    
    body('escrowTimeoutDays')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Escrow timeout days must be between 1 and 30'),
    
    body('platformFee')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Platform fee must be between 0 and 1'),
    
    body('maxFileSize')
      .optional()
      .isInt({ min: 1048576, max: 104857600 })
      .withMessage('Max file size must be between 1MB and 100MB'),
    
    body('allowedFileTypes')
      .optional()
      .isArray()
      .withMessage('Allowed file types must be an array'),
    
    body('maintenanceMode')
      .optional()
      .isBoolean()
      .withMessage('Maintenance mode must be a boolean'),
    
    body('maintenanceMessage')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Maintenance message cannot exceed 500 characters')
  ],

  verifyProperty: [
    body('verificationStatus')
      .isIn(['approved', 'rejected'])
      .withMessage('Verification status must be approved or rejected'),
    
    body('verificationNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Verification notes cannot exceed 500 characters')
  ]
};

// Sanitization middleware
exports.sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        obj[key] = obj[key].replace(/javascript:/gi, '');
        obj[key] = obj[key].replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
};

// Rate limiting for sensitive operations
exports.sensitiveOperationLimiter = (req, res, next) => {
  // This would be implemented with a more sophisticated rate limiting system
  // For now, we'll use a simple approach
  const key = `${req.ip}-${req.user?.id || 'anonymous'}`;
  
  // In a real implementation, you'd use Redis or similar
  // For now, just pass through
  next();
};
