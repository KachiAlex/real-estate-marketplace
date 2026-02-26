const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const propertyService = require('../services/propertyService');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const mockUsers = require('../data/mockUsers');

// @desc    Get all properties with filtering and pagination
// @route   GET /api/properties
// @access  Public
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('type').optional().isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']).withMessage('Invalid property type'),
  query('status').optional().isIn(['for-sale', 'for-rent', 'sold', 'rented']).withMessage('Invalid status'),
  query('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  query('bathrooms').optional().isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  query('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  query('state').optional().trim().notEmpty().withMessage('State cannot be empty')
], async (req, res) => {
  try {
    console.log('GET /api/properties called with query:', req.query);
    // Developer debug helper: force an error when `debug=true` to capture stack traces
    if (String(req.query.debug).toLowerCase() === 'true' || String(req.query.debug) === '1') {
      throw new Error('Intentional debug error from /api/properties (debug=true)');
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 12,
      status,
      verificationStatus,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    let properties = [];
    let pagination = { currentPage: Number(page), totalPages: 1, totalItems: 0, itemsPerPage: Number(limit) };
    let stats = { total: 0 };

    try {
      const result = await propertyService.listProperties({
        page,
        limit,
        status,
        verificationStatus,
        search,
        sort,
        order
      });
      if (result && Array.isArray(result.properties)) {
        properties = result.properties;
        pagination = result.pagination || pagination;
        stats = result.stats || stats;
      }
    } catch (svcErr) {
      console.warn('propertyService.listProperties failed, falling back to mockUsers if available:', svcErr && svcErr.message ? svcErr.message : svcErr);
      // keep defaults and allow mockUsers fallback below
    }

    // If DB returned no properties but we have a mock vendor (local dev), use mock properties
    let outProperties = properties;
    let outPagination = pagination;
    let outStats = stats;

    if ((!properties || properties.length === 0) && (req.query.ownerId || (req.user && req.user.role === 'vendor'))) {
      const lookupId = req.query.ownerId || (req.user && req.user.email) || null;
      if (lookupId) {
        const mu = mockUsers.find(u => String(u.email || '').toLowerCase() === String(lookupId || '').toLowerCase() || String(u.id || '') === String(lookupId));
        if (mu && mu.vendorData && Array.isArray(mu.vendorData.properties)) {
          outProperties = mu.vendorData.properties;
          outPagination = { currentPage: 1, totalPages: 1, totalItems: outProperties.length, itemsPerPage: outProperties.length };
          outStats = { total: outProperties.length };
        }
      }
    }

    res.json({
      success: true,
      data: outProperties,
      pagination: outPagination,
      stats: outStats
    });
  } catch (error) {
    console.error('Get properties error:', error && error.stack ? error.stack : error);
    try {
      const logPath = path.resolve(__dirname, '..', 'server_error.log');
      const entry = `[${new Date().toISOString()}] GET /api/properties error:\n${error && error.stack ? error.stack : String(error)}\n---\n`;
      fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
    } catch (fsErr) {
      console.error('Failed to write properties error to server_error.log:', fsErr.message);
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new property
// @route   POST /api/properties
// @access  Private
router.post('/', protect, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('type').isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']).withMessage('Invalid property type'),
  body('status').optional().isIn(['for-sale', 'for-rent', 'sold', 'rented']).withMessage('Invalid status'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('details.bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('details.bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  body('details.sqft').isFloat({ min: 0 }).withMessage('Square footage must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const propertyData = {
      ...req.body,
      owner: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      }
    };

    const property = await propertyService.createProperty(propertyData);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
router.put('/:id', protect, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('type').optional().isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']).withMessage('Invalid property type'),
  body('status').optional().isIn(['for-sale', 'for-rent', 'sold', 'rented']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const property = await propertyService.getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership
    if (property.owner?.id && property.owner.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
    }

    const updatedProperty = await propertyService.updateProperty(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.owner?.id && property.owner.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
    }

    await propertyService.deleteProperty(req.params.id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Toggle favorite property
// @route   POST /api/properties/:id/favorite
// @access  Private
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const property = await propertyService.toggleFavorite(req.params.id, req.user.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      message: property.isFavorited ? 'Added to favorites' : 'Removed from favorites',
      isFavorited: property.isFavorited
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 