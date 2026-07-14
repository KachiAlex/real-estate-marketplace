const realCloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

let cloudinary = realCloudinary;

// Dev-mode fake Cloudinary shim: when CLOUDINARY_FAKE=true we provide a minimal
// in-process implementation that signs upload params and stores uploaded files
// under ./uploads/cloudinaryMock so dev flows and signed endpoints work without
// real Cloudinary credentials.
if (process.env.CLOUDINARY_FAKE === 'true') {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'cloudinaryMock');
  fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

  const fakeUploader = {
    uploader: {
      upload: async (filePath, options = {}) => {
        // copy file into uploads/cloudinaryMock and return a fake secure_url/public_id
        const filename = path.basename(filePath);
        const dest = path.join(uploadsDir, `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`);
        try {
          await fs.copyFile(filePath, dest);
        } catch (e) {
          throw new Error('Failed to copy file to fake cloud storage: ' + e.message);
        }
        const publicId = path.basename(dest).replace(/\.[^.]+$/, '');
        return {
          secure_url: `/uploads/cloudinaryMock/${path.basename(dest)}`,
          public_id: publicId,
          format: path.extname(filename).replace('.', ''),
          bytes: (await fs.stat(dest)).size,
          width: null,
          height: null,
          resource_type: options.resource_type || 'image'
        };
      },
      destroy: async (publicId, opts = {}) => {
        // best effort: delete matching files in cloudinaryMock folder
        try {
          const files = await fs.readdir(uploadsDir);
          const matches = files.filter(f => f.includes(publicId));
          for (const m of matches) await fs.unlink(path.join(uploadsDir, m)).catch(() => {});
          return { result: matches.length > 0 ? 'ok' : 'not_found' };
        } catch (e) {
          return { result: 'error' };
        }
      }
    },
    api: {
      delete_resources: async (publicIds, opts = {}) => {
        const deleted = {};
        for (const id of publicIds) {
          try {
            const files = await fs.readdir(uploadsDir);
            const matches = files.filter(f => f.includes(id));
            for (const m of matches) await fs.unlink(path.join(uploadsDir, m)).catch(() => {});
            deleted[id] = matches.length > 0 ? 'deleted' : 'not_found';
          } catch (e) {
            deleted[id] = 'error';
          }
        }
        return { deleted };
      }
    },
    utils: {
      // Simple Cloudinary-like signature for params object: build string of key=val sorted
      api_sign_request: (paramsToSign, apiSecret) => {
        const keys = Object.keys(paramsToSign).sort();
        const toSign = keys.map(k => `${k}=${paramsToSign[k]}`).join('&');
        return crypto.createHash('sha1').update(toSign + (apiSecret || process.env.CLOUDINARY_API_SECRET || 'fake_secret')).digest('hex');
      }
    }
  };

  cloudinary = fakeUploader;
}

// Configure real Cloudinary when not using the fake shim
if (process.env.CLOUDINARY_FAKE !== 'true') {
  if (process.env.CLOUDINARY_URL) {
    realCloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  } else {
    realCloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
}

// Validate configuration: accept either individual keys or a single CLOUDINARY_URL
const isConfigured = () => {
  if (process.env.CLOUDINARY_FAKE === 'true') return true;
  return !!(
    process.env.CLOUDINARY_URL || (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  );
};

// Upload options for different file types
const uploadOptions = {
  images: {
    folder: 'properties/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    max_file_size: 10485760 // 10MB
  },
  videos: {
    folder: 'properties/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
    max_file_size: 104857600 // 100MB
  },
  documents: {
    folder: 'properties/documents',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    max_file_size: 10485760 // 10MB
  },
  mortgageDocuments: {
    folder: 'mortgages/documents',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'], // Allow images for bank statements
    max_file_size: 10485760 // 10MB
  },
  avatars: {
    folder: 'users/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    max_file_size: 5242880 // 5MB
  }
};

// Generate thumbnail transformations
const getThumbnailUrl = (publicId, width = 400, height = 300) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadOptions,
  getThumbnailUrl
};

