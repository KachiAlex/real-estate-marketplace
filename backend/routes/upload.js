const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { protect } = require('../middleware/auth');
const { requireAnyRole, checkOwnership } = require('../middleware/roleValidation');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param } = require('express-validator');
const {
  uploadPropertyImages,
  uploadPropertyVideos,
  uploadPropertyDocuments,
  uploadAvatar,
  deleteFile,
  deleteMultipleFiles,
  isConfigured,
  generateImageVariants
} = require('../services/uploadService');
const { errorLogger, infoLogger } = require('../config/logger');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/temp');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for disk storage (temp files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Multer configurations for different file types
const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: fileFilter(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'])
});

const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
});

// Check if Cloudinary is configured middleware
const checkCloudinaryConfig = (req, res, next) => {
  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'File upload service is not configured. Please contact administrator.'
    });
  }
  next();
};

/**
 * @route   POST /api/upload/property/:propertyId/images
 * @desc    Upload property images
 * @access  Private (Property Owner or Admin)
 */
router.post(
  '/property/:propertyId/images',
  protect,
  checkCloudinaryConfig,
  imageUpload.array('images', 20), // Max 20 images
  validate([
    param('propertyId').notEmpty().withMessage('Property ID is required')
  ]),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const { propertyId } = req.params;
      const result = await uploadPropertyImages(req.files, propertyId);

      infoLogger('Property images uploaded', {
        userId: req.user.id,
        propertyId,
        count: result.data.totalUploaded
      });

      res.json({
        success: true,
        message: `Successfully uploaded ${result.data.totalUploaded} image(s)`,
        data: result.data
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Property images upload' });
      
      // Clean up any uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path).catch(() => {});
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload images',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/**
 * @route   POST /api/upload/property/:propertyId/videos
 * @desc    Upload property videos
 * @access  Private (Property Owner or Admin)
 */
router.post(
  '/property/:propertyId/videos',
  protect,
  checkCloudinaryConfig,
  videoUpload.array('videos', 5), // Max 5 videos
  validate([
    param('propertyId').notEmpty().withMessage('Property ID is required')
  ]),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const { propertyId } = req.params;
      const result = await uploadPropertyVideos(req.files, propertyId);

      infoLogger('Property videos uploaded', {
        userId: req.user.id,
        propertyId,
        count: result.data.totalUploaded
      });

      res.json({
        success: true,
        message: `Successfully uploaded ${result.data.totalUploaded} video(s)`,
        data: result.data
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Property videos upload' });
      
      // Clean up any uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path).catch(() => {});
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload videos',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/**
 * @route   POST /api/upload/property/:propertyId/documents
 * @desc    Upload property documents
 * @access  Private (Property Owner or Admin)
 */
router.post(
  '/property/:propertyId/documents',
  protect,
  checkCloudinaryConfig,
  documentUpload.array('documents', 10), // Max 10 documents
  validate([
    param('propertyId').notEmpty().withMessage('Property ID is required')
  ]),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const { propertyId } = req.params;
      const result = await uploadPropertyDocuments(req.files, propertyId);

      infoLogger('Property documents uploaded', {
        userId: req.user.id,
        propertyId,
        count: result.data.totalUploaded
      });

      res.json({
        success: true,
        message: `Successfully uploaded ${result.data.totalUploaded} document(s)`,
        data: result.data
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Property documents upload' });
      
      // Clean up any uploaded files on error
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path).catch(() => {});
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload documents',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  '/avatar',
  protect,
  checkCloudinaryConfig,
  avatarUpload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const userId = req.user.id || req.user._id;
      const result = await uploadAvatar(req.file, userId);

      infoLogger('Avatar uploaded', { userId });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: result.data
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Avatar upload' });
      
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlink(req.file.path).catch(() => {});
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload avatar',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/**
 * @route   DELETE /api/upload/:publicId
 * @desc    Delete a file from Cloudinary
 * @access  Private
 */
router.delete(
  '/:publicId(*)',
  protect,
  async (req, res) => {
    try {
      const publicId = req.params.publicId;
      
      // Determine resource type from public ID
      let resourceType = 'image';
      if (publicId.includes('/videos/')) {
        resourceType = 'video';
      } else if (publicId.includes('/documents/')) {
        resourceType = 'raw';
      }

      const result = await deleteFile(publicId, resourceType);

      infoLogger('File deleted', { 
        userId: req.user.id,
        publicId,
        resourceType
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      errorLogger(error, req, { context: 'File deletion' });
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete file',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/**
 * @route   POST /api/upload/delete-multiple
 * @desc    Delete multiple files from Cloudinary
 * @access  Private
 */
router.post(
  '/delete-multiple',
  protect,
  validate([
    body('publicIds').isArray({ min: 1 }).withMessage('At least one public ID required'),
    body('resourceType').optional().isIn(['image', 'video', 'raw']).withMessage('Invalid resource type')
  ]),
  async (req, res) => {
    try {
      const { publicIds, resourceType = 'image' } = req.body;

      const result = await deleteMultipleFiles(publicIds, resourceType);

      infoLogger('Multiple files deleted', {
        userId: req.user.id,
        count: result.data.totalDeleted,
        resourceType
      });

      res.json({
        success: true,
        message: `Successfully deleted ${result.data.totalDeleted} file(s)`,
        data: result.data
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Multiple files deletion' });
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete files',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

/**
 * @route   GET /api/upload/variants/:publicId
 * @desc    Get different size variants of an image
 * @access  Public
 */
router.get(
  '/variants/:publicId(*)',
  async (req, res) => {
    try {
      const publicId = req.params.publicId;
      const variants = generateImageVariants(publicId);

      res.json({
        success: true,
        data: variants
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate image variants'
      });
    }
  }
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed size'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;
