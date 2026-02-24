

/* vendorKyc route relocated below to ensure `router` is defined before use */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { protect, optionalAuth } = require('../middleware/auth');
const { requireAnyRole, checkOwnership } = require('../middleware/roleValidation');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param } = require('express-validator');
const {
  uploadPropertyImages,
  uploadPropertyVideos,
  uploadPropertyDocuments,
  uploadMultipleFiles,
  uploadAvatar,
  uploadMortgageDocuments,
  deleteFile,
  deleteMultipleFiles,
  isConfigured,
  generateImageVariants
} = require('../services/uploadService');
const db = require('../config/sequelizeDb');
const { errorLogger, infoLogger } = require('../config/logger');
const axios = require('axios');
const { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

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
const vendorKycUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ])
});
// Public endpoint: allow unauthenticated vendor onboarding uploads (allow in dev/test without Cloudinary)
router.post(
  '/vendor/kyc',
  optionalAuth,
  vendorKycUpload.array('documents', 10), // Max 10 documents
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }
      // If Cloudinary (or other configured upload service) is available, upload directly
      if (isConfigured && isConfigured()) {
        try {
          const result = await uploadMultipleFiles(req.files, 'documents', { folder: 'vendor/kyc' });
          const uploaded = (result && result.data && result.data.uploaded) || [];
          // If Cloudinary returned failures or no uploaded items, log details for debugging
          try {
            const totalUploaded = result && result.data && typeof result.data.totalUploaded === 'number' ? result.data.totalUploaded : (uploaded && uploaded.length) || 0;
            const totalFailed = result && result.data && typeof result.data.totalFailed === 'number' ? result.data.totalFailed : (result && result.data && result.data.failed ? result.data.failed.length : 0);
            if (totalUploaded === 0 && totalFailed > 0) {
              errorLogger(new Error('Cloud upload returned no uploaded files'), req, {
                context: 'Vendor KYC cloud upload empty result',
                totalUploaded,
                totalFailed,
                failures: result.data.failed,
                files: req.files.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size, path: f.path }))
              });
            }
          } catch (logErr) {
            console.error('Failed to log cloud upload diagnostics:', logErr && logErr.message ? logErr.message : logErr);
          }
          // Ensure original filenames are preserved in response (uploadMultipleFiles returns data without originalname)
          const uploadedWithNames = uploaded.map((u, i) => ({ name: req.files[i] && req.files[i].originalname, ...u }));

          // If debug query flag is present, include raw diagnostics from the upload service for investigation
          if (req.query && req.query.debug === 'true') {
            return res.json({ success: true, data: { uploaded: uploadedWithNames, diagnostics: result && result.data } });
          }
          // If the request included an authenticated user, attach uploaded docs to their vendorData
          if (req.user && req.user.id) {
            try {
              const user = await db.User.findByPk(req.user.id);
              if (user) {
                let vendorData = user.vendorData || {};
                try { vendorData = typeof vendorData === 'string' ? JSON.parse(vendorData) : vendorData; } catch (e) { vendorData = vendorData || {}; }
                vendorData.kycDocs = Array.isArray(vendorData.kycDocs) ? vendorData.kycDocs.concat(uploadedWithNames) : uploadedWithNames;
                vendorData.kycStatus = 'submitted';
                vendorData.updatedAt = new Date();

                // Preserve existing roles and set vendor flags
                let existingRoles = user.roles;
                try { existingRoles = Array.isArray(existingRoles) ? existingRoles : (existingRoles ? JSON.parse(existingRoles) : []); } catch (e) { existingRoles = Array.isArray(user.roles) ? user.roles : []; }
                existingRoles = Array.from(new Set([...(existingRoles || []), 'vendor']));

                await user.update({ role: 'vendor', roles: existingRoles, activeRole: 'vendor', vendorData });
              }
            } catch (attachErr) {
              console.error('Failed to persist KYC uploads to user vendorData:', attachErr && attachErr.message ? attachErr.message : attachErr);
            }
          }
          return res.json({ success: true, data: { uploaded: uploadedWithNames } });
        } catch (cloudErr) {
          // If cloud upload fails, fall back to returning temp paths but still clean up handled below
          console.error('Cloud upload failed, falling back to temp files:', cloudErr);
        }
      }

      // Fallback: return local temp file references (kept for dev/offline flows)
      const uploaded = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        name: file.originalname,
        publicId: file.filename,
        resourceType: 'local'
      }));

      // If authenticated, attach local temp references to vendorData so frontend can see them
      if (req.user && req.user.id) {
        try {
          const user = await db.User.findByPk(req.user.id);
          if (user) {
            let vendorData = user.vendorData || {};
            try { vendorData = typeof vendorData === 'string' ? JSON.parse(vendorData) : vendorData; } catch (e) { vendorData = vendorData || {}; }
            vendorData.kycDocs = Array.isArray(vendorData.kycDocs) ? vendorData.kycDocs.concat(uploaded) : uploaded;
            vendorData.kycStatus = 'submitted';
            vendorData.updatedAt = new Date();

            let existingRoles = user.roles;
            try { existingRoles = Array.isArray(existingRoles) ? existingRoles : (existingRoles ? JSON.parse(existingRoles) : []); } catch (e) { existingRoles = Array.isArray(user.roles) ? user.roles : []; }
            existingRoles = Array.from(new Set([...(existingRoles || []), 'vendor']));

            await user.update({ role: 'vendor', roles: existingRoles, activeRole: 'vendor', vendorData });
          }
        } catch (attachErr) {
          console.error('Failed to persist local KYC uploads to user vendorData:', attachErr && attachErr.message ? attachErr.message : attachErr);
        }
      }

      res.json({
        success: true,
        data: { uploaded }
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Vendor KYC upload' });
      if (req.files) {
        req.files.forEach(file => {
          fs.unlink(file.path).catch(() => {});
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload KYC documents',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

// Provide Cloudinary signed upload params for direct client uploads
router.get('/vendor/kyc/signed', async (req, res) => {
  try {
    const { cloudinary } = require('../config/cloudinary');
    const { isConfigured } = require('../services/uploadService');
    if (!isConfigured()) {
      return res.status(503).json({ success: false, message: 'Upload service not configured' });
    }
    const timestamp = Math.floor(Date.now() / 1000);
    // For signature we sign only timestamp for simple direct uploads; adjust params as needed
    const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);
    res.json({ success: true, data: { api_key: process.env.CLOUDINARY_API_KEY, cloud_name: process.env.CLOUDINARY_CLOUD_NAME, timestamp, signature } });
  } catch (e) {
    console.error('Signed upload error:', e);
    res.status(500).json({ success: false, message: 'Failed to create signed upload' });
  }
});
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

const mortgageDocumentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ])
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
});

// Check if Cloudinary is configured middleware
function checkCloudinaryConfig(req, res, next) {
  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'File upload service is not configured. Please contact administrator.'
    });
  }
  next();
}

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
 * @route   POST /api/upload/mortgage/documents
 * @desc    Upload mortgage application documents (bank statements, etc.)
 * @access  Private
 */
router.post(
  '/mortgage/documents',
  protect,
  checkCloudinaryConfig,
  mortgageDocumentUpload.array('documents', 10), // Max 10 documents
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const userId = req.user.id || req.user._id;
      const { applicationId } = req.body; // Optional: if application already exists
      
      const result = await uploadMortgageDocuments(req.files, userId, applicationId);

      infoLogger('Mortgage documents uploaded', {
        userId,
        applicationId: applicationId || 'pending',
        count: result.data.totalUploaded
      });

      res.json({
        success: true,
        message: `Successfully uploaded ${result.data.totalUploaded} document(s)`,
        data: result.data
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Mortgage documents upload' });
      
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
 * @route   POST /api/upload/sas
 * @desc    Generate short‑lived SAS URL for direct client upload to Azure Blob
 * @access  Private
 */
router.post(
  '/sas',
  protect,
  validate([
    body('filename').notEmpty().withMessage('filename is required'),
    body('container').optional().isString(),
    body('expiresInMinutes').optional().isInt({ min: 1, max: 1440 })
  ]),
  async (req, res) => {
    try {
      const { filename, container = process.env.AZURE_BLOB_CONTAINER || 'uploads', expiresInMinutes = 15 } = req.body;

      if (!filename) {
        return res.status(400).json({ success: false, message: 'filename is required' });
      }

      // Production flow: proxy to Azure Function if configured
      if (process.env.AZURE_FUNCTION_URL) {
        const resp = await axios.post(process.env.AZURE_FUNCTION_URL, { filename, container, expiresInMinutes });
        return res.status(resp.status).json(resp.data);
      }

      // Fallback (local dev): generate SAS token using account key
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
      if (!accountName || !accountKey) {
        return res.status(500).json({ success: false, message: 'Azure storage not configured' });
      }

      const sharedKey = new StorageSharedKeyCredential(accountName, accountKey);
      const expiresOn = new Date(Date.now() + Number(expiresInMinutes) * 60 * 1000);

      const sasToken = generateBlobSASQueryParameters({
        containerName: container,
        blobName: filename,
        expiresOn,
        permissions: BlobSASPermissions.parse('cw')
      }, sharedKey).toString();

      const blobUrl = `https://${accountName}.blob.core.windows.net/${container}/${filename}`;
      const uploadUrl = `${blobUrl}?${sasToken}`;

      res.json({ success: true, data: { uploadUrl, blobUrl, expiresOn: expiresOn.toISOString() } });
    } catch (error) {
      errorLogger(error, req, { context: 'Generate upload SAS' });
      res.status(500).json({ success: false, message: error.message });
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
