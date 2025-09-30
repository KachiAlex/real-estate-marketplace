const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body } = require('express-validator');
const path = require('path');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'), false);
    }
  }
});

// @desc    Upload single file
// @route   POST /api/upload
// @access  Private
router.post('/', 
  protect,
  upload.single('file'),
  sanitizeInput,
  validate([
    body('uploadType').isIn(['property_images', 'user_avatar', 'escrow_document', 'general']).withMessage('Invalid upload type'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ]),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const { uploadType = 'general', metadata = {} } = req.body;
      const userId = req.user._id;

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${timestamp}_${req.user._id}${fileExtension}`;

      // Determine upload folder based on type
      let uploadFolder = 'general';
      let publicId = `real-estate/${uploadFolder}/${fileName}`;

      switch (uploadType) {
        case 'property_images':
          uploadFolder = 'properties';
          publicId = `real-estate/${uploadFolder}/${metadata.propertyId || 'temp'}/${fileName}`;
          break;
        case 'user_avatar':
          uploadFolder = 'users';
          publicId = `real-estate/${uploadFolder}/${userId}/avatar_${timestamp}`;
          break;
        case 'escrow_document':
          uploadFolder = 'escrow';
          publicId = `real-estate/${uploadFolder}/${metadata.escrowId || 'temp'}/${fileName}`;
          break;
        default:
          uploadFolder = 'general';
          publicId = `real-estate/${uploadFolder}/${fileName}`;
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          public_id: publicId,
          folder: `real-estate/${uploadFolder}`,
          resource_type: 'auto',
          tags: [uploadType, userId.toString()],
          context: {
            uploadedBy: userId.toString(),
            uploadType,
            originalName: req.file.originalname,
            ...metadata
          }
        }
      );

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          assetId: result.asset_id,
          originalName: req.file.originalname,
          size: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          uploadType,
          metadata: {
            ...metadata,
            uploadedBy: userId,
            uploadedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple',
  protect,
  upload.array('files', 10), // Max 10 files
  sanitizeInput,
  validate([
    body('uploadType').isIn(['property_images', 'escrow_document', 'general']).withMessage('Invalid upload type'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ]),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const { uploadType = 'general', metadata = {} } = req.body;
      const userId = req.user._id;

      const uploadPromises = req.files.map(async (file, index) => {
        try {
          const timestamp = Date.now();
          const fileExtension = path.extname(file.originalname);
          const fileName = `${timestamp}_${index}_${req.user._id}${fileExtension}`;

          let uploadFolder = 'general';
          let publicId = `real-estate/${uploadFolder}/${fileName}`;

          switch (uploadType) {
            case 'property_images':
              uploadFolder = 'properties';
              publicId = `real-estate/${uploadFolder}/${metadata.propertyId || 'temp'}/${fileName}`;
              break;
            case 'escrow_document':
              uploadFolder = 'escrow';
              publicId = `real-estate/${uploadFolder}/${metadata.escrowId || 'temp'}/${fileName}`;
              break;
            default:
              uploadFolder = 'general';
              publicId = `real-estate/${uploadFolder}/${fileName}`;
          }

          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              public_id: publicId,
              folder: `real-estate/${uploadFolder}`,
              resource_type: 'auto',
              tags: [uploadType, userId.toString()],
              context: {
                uploadedBy: userId.toString(),
                uploadType,
                originalName: file.originalname,
                ...metadata
              }
            }
          );

          return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            assetId: result.asset_id,
            originalName: file.originalname,
            size: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
            uploadType,
            metadata: {
              ...metadata,
              uploadedBy: userId,
              uploadedAt: new Date()
            }
          };
        } catch (error) {
          return {
            success: false,
            originalName: file.originalname,
            error: error.message
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      res.json({
        success: failed.length === 0,
        message: `${successful.length} file(s) uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: {
          successful,
          failed,
          total: req.files.length,
          uploadType,
          metadata
        }
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Multiple file upload failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @desc    Delete file
// @route   DELETE /api/upload/:publicId
// @access  Private
router.delete('/:publicId',
  protect,
  sanitizeInput,
  async (req, res) => {
    try {
      const { publicId } = req.params;

      // Verify the file belongs to the user (basic check)
      const resource = await cloudinary.api.resource(publicId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check if user has permission to delete (uploaded by them or admin)
      const uploadedBy = resource.context?.uploadedBy;
      if (uploadedBy !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this file'
        });
      }

      await cloudinary.uploader.destroy(publicId);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// @desc    Get file info
// @route   GET /api/upload/:publicId
// @access  Private
router.get('/:publicId',
  protect,
  sanitizeInput,
  async (req, res) => {
    try {
      const { publicId } = req.params;

      const resource = await cloudinary.api.resource(publicId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check if user has permission to view (uploaded by them or admin)
      const uploadedBy = resource.context?.uploadedBy;
      if (uploadedBy !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view this file'
        });
      }

      res.json({
        success: true,
        data: {
          url: resource.secure_url,
          publicId: resource.public_id,
          assetId: resource.asset_id,
          originalName: resource.context?.originalName,
          size: resource.bytes,
          format: resource.format,
          width: resource.width,
          height: resource.height,
          uploadType: resource.context?.uploadType,
          uploadedBy: resource.context?.uploadedBy,
          uploadedAt: resource.created_at,
          metadata: resource.context
        }
      });

    } catch (error) {
      console.error('Get file info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file info',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router; 