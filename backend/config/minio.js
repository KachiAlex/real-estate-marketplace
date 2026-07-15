const Minio = require('minio');
const path = require('path');

const endPoint = process.env.MINIO_ENDPOINT || '127.0.0.1';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const useSSL = process.env.MINIO_USE_SSL === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || 'propertyark-app';
const secretKey = process.env.MINIO_SECRET_KEY || 'Pr0p3rtyArk2025MinIOAppSecret';
const bucketName = process.env.MINIO_BUCKET || 'propertyark';

// Internal client for server-side operations (uploads, deletes, etc.)
const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey
});

// Public client for generating presigned URLs accessible from the browser
const publicEndPoint = process.env.MINIO_PUBLIC_ENDPOINT || 'www.propertyark.africa';
const publicPort = parseInt(process.env.MINIO_PUBLIC_PORT || '443', 10);
const publicUseSSL = process.env.MINIO_PUBLIC_USE_SSL !== 'false';

const publicMinioClient = new Minio.Client({
  endPoint: publicEndPoint,
  port: publicPort,
  useSSL: publicUseSSL,
  accessKey,
  secretKey
});

const isConfigured = () => {
  return !!(accessKey && secretKey && bucketName);
};

const publicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL || '/uploads';

const uploadOptions = {
  images: {
    folder: 'properties/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    max_file_size: 10485760
  },
  videos: {
    folder: 'properties/videos',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
    max_file_size: 104857600
  },
  documents: {
    folder: 'properties/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    max_file_size: 10485760
  },
  mortgageDocuments: {
    folder: 'mortgages/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
    max_file_size: 10485760
  },
  avatars: {
    folder: 'users/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5242880
  }
};

module.exports = {
  minioClient,
  publicMinioClient,
  isConfigured,
  bucketName,
  publicBaseUrl,
  uploadOptions
};
