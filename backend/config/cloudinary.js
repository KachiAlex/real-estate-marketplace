const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Validate configuration
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
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

