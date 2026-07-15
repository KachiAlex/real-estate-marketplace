const { minioClient, publicMinioClient, isConfigured, bucketName, publicBaseUrl } = require('../config/minio');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      await minioClient.setBucketPolicy(bucketName, JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }]
      }));
    }
  } catch (e) {
    console.warn('MinIO ensureBucket:', e.message);
  }
};

const uploadFile = async (file, category = 'images', options = {}) => {
  if (!isConfigured()) {
    throw new Error('MinIO is not configured');
  }

  await ensureBucket();

  const folder = options.folder || category || 'images';
  const ext = path.extname(file.originalname || 'file') || '';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const objectKey = `${folder}/${filename}`;

  let fileStream;
  let tempPath = null;

  if (file.buffer) {
    const { Readable } = require('stream');
    fileStream = Readable.from(file.buffer);
  } else if (file.path) {
    tempPath = file.path;
    const { createReadStream } = require('fs');
    fileStream = createReadStream(file.path);
  } else {
    throw new Error('No file data available for upload');
  }

  const metaData = {
    'Content-Type': file.mimetype || 'application/octet-stream',
  };

  await minioClient.putObject(bucketName, objectKey, fileStream, file.size, metaData);

  if (tempPath) {
    await fs.unlink(tempPath).catch(() => {});
  }

  const url = `${publicBaseUrl}/${objectKey}`;
  const publicId = objectKey.replace(/\.[^.]+$/, '');

  return {
    success: true,
    data: {
      url,
      publicId,
      format: ext.replace('.', ''),
      size: file.size,
      width: null,
      height: null,
      resourceType: category === 'videos' ? 'video' : (category === 'documents' ? 'raw' : 'image')
    }
  };
};

const uploadMultipleFiles = async (files, category = 'images', options = {}) => {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const result = await uploadFile(file, category, options);
        return result.data;
      } catch (e) {
        return { success: false, error: e.message, originalName: file.originalname };
      }
    })
  );
  return {
    success: results.every(r => r.success !== false),
    data: results
  };
};

const deleteFile = async (publicId) => {
  try {
    const objects = await minioClient.listObjects(bucketName, publicId, true);
    const toDelete = [];
    for await (const obj of objects) {
      toDelete.push(obj.name);
    }
    if (toDelete.length > 0) {
      await minioClient.removeObjects(bucketName, toDelete);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const getPresignedUrl = async (objectKey, expirySeconds = 3600) => {
  if (!isConfigured()) {
    throw new Error('MinIO is not configured');
  }
  await ensureBucket();
  // Generate presigned URL using internal client (can reach MinIO directly)
  // then replace the internal host with the public domain
  const internalUrl = await minioClient.presignedPutObject(bucketName, objectKey, expirySeconds);
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'www.propertyark.africa';
  const publicPort = process.env.MINIO_PUBLIC_PORT || '443';
  const publicUseSSL = process.env.MINIO_PUBLIC_USE_SSL !== 'false';
  const protocol = publicUseSSL ? 'https' : 'http';
  const portPart = (publicUseSSL && publicPort === '443') || (!publicUseSSL && publicPort === '80') ? '' : `:${publicPort}`;
  const publicHost = `${protocol}://${publicEndpoint}${portPart}`;
  // Replace the internal endpoint in the URL with the public one
  const internalEndpoint = process.env.MINIO_ENDPOINT || '127.0.0.1';
  const internalPort = process.env.MINIO_PORT || '9000';
  const internalHost = `http://${internalEndpoint}:${internalPort}`;
  return internalUrl.replace(internalHost, publicHost);
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getPresignedUrl,
  isConfigured
};
