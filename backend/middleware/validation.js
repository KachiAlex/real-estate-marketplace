const { body, validationResult } = require('express-validator');

// Validation middleware - can be used with an array of validations or as chain-aware middleware
exports.validate = (validations) => {
  // If validations is an array, use it
  if (validations && Array.isArray(validations)) {
    return async (req, res, next) => {
      try {
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
      } catch (error) {
        console.error('Validation middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Validation error occurred'
        });
      }
    };
  }
  
  // If called without parameters, validate the chain (for use with express-validator chain)
  // This assumes the validations were already set up in the middleware chain
  return async (req, res, next) => {
    try {
      // Check for validation errors from the chain
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
          }))
        });
      }
      // If no errors, continue to next middleware
      return next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      // Log the error but don't crash - continue to next middleware
      return next();
    }
  };
};

exports.verificationValidation = {
  application: [
    body('propertyName')
      .trim()
      .notEmpty()
      .withMessage('Property name is required')
      .isLength({ min: 3, max: 150 })
      .withMessage('Property name must be between 3 and 150 characters'),

    body('propertyUrl')
      .optional()
      .trim()
      .isURL()
      .withMessage('Property URL must be a valid link'),

    body('propertyLocation')
      .optional()
      .isString()
      .withMessage('Property location must be a string'),

    body('verificationPaymentId')
      .trim()
      .notEmpty()
      .withMessage('Verification payment ID is required'),

    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),

    body('attachments')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Attachments must be an array of up to 5 URLs'),

    body('attachments.*')
      .optional()
      .trim()
      .isURL()
      .withMessage('Each attachment must be a valid URL'),

    body('preferredBadgeColor')
      .optional()
      .matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
      .withMessage('Preferred badge color must be a valid hex color')
  ],

  decision: [
    body('status')
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Status must be pending, approved, or rejected'),

    body('adminNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Admin notes cannot exceed 500 characters'),

    body('badgeColor')
      .optional()
      .matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
      .withMessage('Badge color must be a valid hex color')
  ]
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
          // Accept any string of digits when provided
          .matches(/^\+?\d+$/)
          .withMessage('Please provide a valid phone number'),
        body('countryCode')
          .optional()
          .matches(/^\+?\d{1,4}$/)
          .withMessage('Please provide a valid country code'),
        body('phoneNumber')
          .optional()
          .matches(/^\d+$/)
          .withMessage('Please provide a valid phone number'),
    
    body('phone')
      .optional()
      // Accept any string of digits when provided
          .matches(/^\+?\d+$/)
      .withMessage('Please provide a valid phone number'),
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
      body('phone')
        .optional()
        // Accept common Nigerian phone formats: +234XXXXXXXXXX, 234XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX
        .matches(/^(?:\+234\d{10}|234\d{10}|0\d{10}|\d{10})$/)
        .withMessage('Please provide a valid phone number'),
    
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
    
    body('vendorListingFee')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Vendor listing fee must be a non-negative integer'),
    
    body('escrowTimeoutDays')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Escrow timeout days must be between 1 and 30'),
    
    body('platformFee')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Platform fee must be between 0 and 1'),
    
    body('verificationBadgeColor')
      .optional()
      .matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/)
      .withMessage('Verification badge color must be a valid hex color'),
    
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
      .isIn(['verified', 'rejected'])
      .withMessage('Verification status must be verified or rejected'),
    
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
