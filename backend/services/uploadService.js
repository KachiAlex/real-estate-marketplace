const { cloudinary, isConfigured, uploadOptions, getThumbnailUrl } = require('../config/cloudinary');
const { isValidFileType, isValidFileSize } = require('../config/security');
const { infoLogger, errorLogger } = require('../config/logger');
const fs = require('fs').promises;

/**
 * Upload Service
 * Handles file uploads to Cloudinary with validation and error handling
 */

/**
 * Upload a single file to Cloudinary
 * @param {Object} file - Multer file object
 * @param {String} category - File category (images, videos, documents, avatars)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadFile = async (file, category = 'images', options = {}) => {
  try {
    // Check if Cloudinary is configured
    if (!isConfigured()) {
      throw new Error('Cloudinary is not configured. Please set environment variables.');
    }

    // Normalize category keys to match `securityConfig.allowedFileTypes` and `fileSizeLimits`
    const normalizeCategory = (cat) => {
      const c = String(cat || '').toLowerCase();
      if (c.includes('image') || c === 'avatars' || c === 'avatars') return 'images';
      if (c.includes('video')) return 'videos';
      if (c.includes('mortgage')) return 'mortgageDocument';
      if (c.includes('document')) return 'documents';
      return c.endsWith('s') ? c : `${c}s`;
    };

    const securityCategory = normalizeCategory(category);

    // Validate file type
    if (!isValidFileType(file.mimetype, securityCategory)) {
      const allowedList = (require('../config/security').securityConfig.allowedFileTypes[securityCategory] || []);
      // Log diagnostic info to help debug mismatched mimetypes
      try {
        infoLogger('Rejected file type', { filename: file.originalname, mimetype: file.mimetype, expected: allowedList });
      } catch (e) {}
      // Fallback: accept by file extension if mimetype is unreliable (some clients/proxies strip mimetype)
      try {
        const path = require('path');
        const ext = (path.extname(file.originalname) || '').replace('.', '').toLowerCase();
        const allowedExts = allowedList.map(t => t.split('/').pop().toLowerCase());
        if (ext && allowedExts.includes(ext)) {
          infoLogger('Accepted file by extension fallback', { filename: file.originalname, ext, allowedExts });
        } else {
          throw new Error(`Invalid file type. Allowed types: ${allowedList.map(t => t.split('/').pop()).join(', ')}`);
        }
      } catch (e) {
        throw e;
      }
    }

    // Validate file size
    if (!isValidFileSize(file.size, securityCategory)) {
      const maxSizeMB = (uploadOptions[category]?.max_file_size || 10485760) / 1048576;
      throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
    }

    // Prepare upload options
    const uploadConfig = {
      ...uploadOptions[category],
      ...options,
      use_filename: true,
      unique_filename: true,
    };

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, uploadConfig);

    // Delete local file after upload
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      errorLogger(unlinkError, null, { context: 'File cleanup after upload' });
    }

    infoLogger('File uploaded successfully', {
      publicId: result.public_id,
      category,
      size: file.size
    });

    return {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        resourceType: result.resource_type,
        thumbnail: category === 'images' ? getThumbnailUrl(result.public_id) : null
      }
    };
  } catch (error) {
    // Clean up local file on error
    try {
      if (file.path) {
        await fs.unlink(file.path);
      }
    } catch (unlinkError) {
      // Ignore cleanup errors
    }

    errorLogger(error, null, { context: 'File upload', filename: file.originalname });
    throw error;
  }
};

/**
 * Upload multiple files
 * @param {Array} files - Array of Multer file objects
 * @param {String} category - File category
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload results
 */
const uploadMultipleFiles = async (files, category = 'images', options = {}) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadPromises = files.map(file => uploadFile(file, category, options));
    const results = await Promise.allSettled(uploadPromises);

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value.data);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason?.message || 'Upload failed');

    if (failed.length > 0) {
      console.warn('uploadMultipleFiles - some uploads failed:', failed);
    }

    const data = {
      uploaded: successful,
      failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    };

    // Include lightweight debug info about each promise result to aid investigation
    try {
      data.results = results.map(r => ({ status: r.status, reason: r.reason ? (r.reason.message || String(r.reason)) : undefined, value: r.status === 'fulfilled' ? r.value && r.value.data : undefined }));
    } catch (e) {
      // ignore any issues building debug info
    }

    return {
      success: successful.length > 0,
      data
    };
  } catch (error) {
    errorLogger(error, null, { context: 'Multiple file upload' });
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    if (!isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    infoLogger('File deleted successfully', { publicId, resourceType });

    return {
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'File deleted successfully' : 'File not found or already deleted'
    };
  } catch (error) {
    errorLogger(error, null, { context: 'File deletion', publicId });
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 * @param {String} resourceType - Resource type
 * @returns {Promise<Object>} Deletion results
 */
const deleteMultipleFiles = async (publicIds, resourceType = 'image') => {
  try {
    if (!publicIds || publicIds.length === 0) {
      throw new Error('No public IDs provided');
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType
    });

    const deleted = Object.keys(result.deleted).filter(id => result.deleted[id] === 'deleted');
    const notFound = Object.keys(result.deleted).filter(id => result.deleted[id] === 'not_found');

    infoLogger('Multiple files deleted', {
      totalDeleted: deleted.length,
      totalNotFound: notFound.length
    });

    return {
      success: true,
      data: {
        deleted,
        notFound,
        totalDeleted: deleted.length,
        totalNotFound: notFound.length
      }
    };
  } catch (error) {
    errorLogger(error, null, { context: 'Multiple file deletion' });
    throw error;
  }
};

/**
 * Upload property images with optimizations
 * @param {Array} files - Array of image files
 * @param {String} propertyId - Property ID for folder organization
 * @returns {Promise<Object>} Upload results
 */
const uploadPropertyImages = async (files, propertyId) => {
  try {
    const options = {
      folder: `properties/${propertyId}/images`,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    return await uploadMultipleFiles(files, 'images', options);
  } catch (error) {
    errorLogger(error, null, { context: 'Property images upload', propertyId });
    throw error;
  }
};

/**
 * Upload property videos
 * @param {Array} files - Array of video files
 * @param {String} propertyId - Property ID for folder organization
 * @returns {Promise<Object>} Upload results
 */
const uploadPropertyVideos = async (files, propertyId) => {
  try {
    const options = {
      folder: `properties/${propertyId}/videos`,
      resource_type: 'video'
    };

    return await uploadMultipleFiles(files, 'videos', options);
  } catch (error) {
    errorLogger(error, null, { context: 'Property videos upload', propertyId });
    throw error;
  }
};

/**
 * Upload property documents
 * @param {Array} files - Array of document files
 * @param {String} propertyId - Property ID for folder organization
 * @returns {Promise<Object>} Upload results
 */
const uploadPropertyDocuments = async (files, propertyId) => {
  try {
    const options = {
      folder: `properties/${propertyId}/documents`,
      resource_type: 'raw'
    };

    return await uploadMultipleFiles(files, 'documents', options);
  } catch (error) {
    errorLogger(error, null, { context: 'Property documents upload', propertyId });
    throw error;
  }
};

/**
 * Upload user avatar
 * @param {Object} file - Image file
 * @param {String} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
const uploadAvatar = async (file, userId) => {
  try {
    const options = {
      folder: `users/${userId}/avatar`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    return await uploadFile(file, 'avatars', options);
  } catch (error) {
    errorLogger(error, null, { context: 'Avatar upload', userId });
    throw error;
  }
};

/**
 * Upload mortgage application documents
 * @param {Array} files - Array of document files
 * @param {String} userId - User ID for folder organization
 * @param {String} applicationId - Optional application ID if known
 * @returns {Promise<Object>} Upload results
 */
const uploadMortgageDocuments = async (files, userId, applicationId = null) => {
  try {
    const folderPath = applicationId 
      ? `mortgages/${userId}/${applicationId}/documents`
      : `mortgages/${userId}/documents`;
    
    const options = {
      folder: folderPath,
      resource_type: 'raw'
    };

    return await uploadMultipleFiles(files, 'mortgageDocuments', options);
  } catch (error) {
    errorLogger(error, null, { context: 'Mortgage documents upload', userId, applicationId });
    throw error;
  }
};

/**
 * Generate image variants (thumbnails, different sizes)
 * @param {String} publicId - Cloudinary public ID
 * @returns {Object} URLs for different sizes
 */
const generateImageVariants = (publicId) => {
  return {
    original: cloudinary.url(publicId, { secure: true }),
    large: getThumbnailUrl(publicId, 1920, 1080),
    medium: getThumbnailUrl(publicId, 1200, 800),
    small: getThumbnailUrl(publicId, 800, 600),
    thumbnail: getThumbnailUrl(publicId, 400, 300),
    card: getThumbnailUrl(publicId, 600, 400)
  };
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  uploadPropertyImages,
  uploadPropertyVideos,
  uploadPropertyDocuments,
  uploadAvatar,
  uploadMortgageDocuments,
  generateImageVariants,
  isConfigured
};

