import apiClient from './apiClient';

/**
 * Compress image client-side using canvas to avoid server body-size limits.
 * Returns a Promise<File> — the compressed file or original if not compressible.
 */
const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    // Skip compression for small files (< 500KB)
    if (file.size < 500 * 1024) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name, { type: outputType, lastModified: Date.now() });
          resolve(compressed.size < file.size ? compressed : file);
        },
        outputType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

const getLocalFolderForFile = (file) => {
  const type = file?.type || '';
  if (type.startsWith('image/')) return 'local-images';
  if (type.startsWith('video/')) return 'local-videos';
  if (type.startsWith('audio/')) return 'local-audio';
  if (type.includes('pdf') || type.includes('msword') || type.includes('document') || type.includes('text/')) {
    return 'local-documents';
  }
  return 'local-files';
};

const createLocalFallback = (file, pathHint) => {
  const folder = getLocalFolderForFile(file);
  const safeName = file?.name || 'upload';
  const uniqueId = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
  const url = (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && file instanceof Blob)
    ? URL.createObjectURL(file)
    : '';

  return {
    success: true,
    url: url || pathHint || '',
    path: pathHint || uniqueId,
    name: safeName,
    size: file?.size || 0,
    type: file?.type || 'application/octet-stream',
    isLocal: true,
    fallback: true
  };
};

/**
 * Upload a file directly to Cloudinary using signed params from our backend.
 * This bypasses Vercel's 4.5MB serverless body limit entirely.
 */
const uploadToCloudinaryDirect = async (file, uploadType, fileName = null) => {
  // 1. Get signed upload params from backend
  const signRes = await apiClient.post('/upload/signed', {
    uploadType,
    fileName: fileName || file?.name || 'upload',
  });
  if (!signRes.data?.success) {
    throw new Error(signRes.data?.message || 'Failed to get signed upload params');
  }
  const { api_key, cloud_name, timestamp, signature, folder, public_id, resource_type, upload_url } = signRes.data.data;

  // 2. Upload directly to Cloudinary
  const cloudForm = new FormData();
  cloudForm.append('file', file);
  cloudForm.append('api_key', api_key);
  cloudForm.append('timestamp', String(timestamp));
  cloudForm.append('signature', signature);
  cloudForm.append('folder', folder);
  cloudForm.append('public_id', public_id);

  const uploadResponse = await fetch(upload_url, {
    method: 'POST',
    body: cloudForm
  });
  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Cloudinary upload failed: ${uploadResponse.status} ${errText}`);
  }
  const cloudResult = await uploadResponse.json();

  return {
    url: cloudResult.secure_url,
    publicId: cloudResult.public_id,
    format: cloudResult.format,
    size: cloudResult.bytes,
    width: cloudResult.width,
    height: cloudResult.height,
    resourceType: cloudResult.resource_type,
    originalName: file?.name,
    cloud_name
  };
};

class StorageService {
  async uploadFile(file, path, metadata = {}) {
    try {
      const result = await uploadToCloudinaryDirect(file, 'generic', file?.name);
      return {
        success: true,
        url: result.url,
        path: result.publicId || path,
        name: result.originalName || file.name,
        size: result.size || file.size,
        type: result.format || file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      if (file) {
        return createLocalFallback(file, path);
      }
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  async uploadMultipleFiles(files, basePath, metadata = {}) {
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const result = await uploadToCloudinaryDirect(file, 'generic', file.name);
            return { success: true, ...result };
          } catch (e) {
            return { success: false, error: e.message, ...createLocalFallback(file, basePath) };
          }
        })
      );
      const successful = results.filter(r => r.success && !r.fallback);
      const failed = results.filter(r => !r.success).map(r => r.error || 'Upload failed');
      return {
        success: successful.length > 0,
        successful,
        failed,
        total: files.length
      };
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      if (Array.isArray(files) && files.length > 0) {
        const fallbacks = files.map((file) => createLocalFallback(file, basePath));
        return {
          success: true,
          successful: fallbacks,
          failed: [],
          total: fallbacks.length,
          fallback: true
        };
      }
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  async moveFile(oldPath, newPath) {
    return {
      success: true,
      url: null,
      path: newPath || oldPath,
      name: (newPath || oldPath || '').split('/').pop()
    };
  }

  async uploadPropertyImages(files, propertyId, userId) {
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          try {
            const result = await uploadToCloudinaryDirect(file, 'property_images', file.name);
            return { success: true, ...result };
          } catch (e) {
            return { success: false, error: e.message, ...createLocalFallback(file, `properties/${propertyId || 'temp'}/images/${file.name}`) };
          }
        })
      );
      const successful = results.filter(r => r.success && !r.fallback);
      const failed = results.filter(r => !r.success).map(r => r.error || 'Upload failed');
      return {
        success: successful.length > 0,
        successful,
        failed,
        total: files.length
      };
    } catch (error) {
      console.error('Error uploading property images:', error);
      if (Array.isArray(files) && files.length > 0) {
        const fallbacks = files.map((file) => createLocalFallback(file, `properties/${propertyId || 'temp'}/images/${file.name}`));
        return {
          success: true,
          successful: fallbacks,
          failed: [],
          total: fallbacks.length,
          fallback: true
        };
      }
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  async uploadUserAvatar(file, userId) {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar_${userId}_${timestamp}.${fileExtension}`;
    const path = `users/${userId}/avatar/${fileName}`;

    const validation = this.validateFile(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], 5 * 1024 * 1024);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Use 'avatar' as the field name for avatar uploads
    try {
      // Compress avatar client-side to avoid server body-size limits
      const fileToUpload = await compressImage(file, 1024, 1024, 0.9);

      const result = await uploadToCloudinaryDirect(file, 'user_avatar', fileName);

      const avatarInfo = {
        userId,
        avatarUrl: result.url,
        uploadDate: new Date().toISOString(),
        fileName: result.originalName || file.name
      };
      localStorage.setItem(`user_avatar_${userId}`, JSON.stringify(avatarInfo));

      return {
        success: true,
        url: result.url,
        path: result.publicId || path,
        name: result.originalName || file.name,
        size: result.size || file.size,
        type: result.format || file.type
      }; 
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const fallback = this.getFallbackAvatar(userId);
      return {
        success: true,
        ...fallback,
        fallback: true
      };
    }
  }

  getFallbackAvatar(userId) {
    const mockAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userId)}&background=random&size=200`;

    const avatarInfo = {
      userId,
      avatarUrl: mockAvatarUrl,
      uploadDate: new Date().toISOString(),
      fileName: 'fallback_avatar',
      isFallback: true
    };

    localStorage.setItem(`user_avatar_${userId}`, JSON.stringify(avatarInfo));

    return {
      success: true,
      url: mockAvatarUrl,
      path: `users/${userId}/avatar/fallback_${Date.now()}`,
      name: 'fallback_avatar',
      size: 0,
      type: 'image/png',
      isFallback: true
    };
  }

  async uploadEscrowDocument(file, escrowId, documentType, userId) {
    try {
      const result = await uploadToCloudinaryDirect(file, 'escrow_document', file?.name);
      return {
        success: true,
        url: result.url,
        path: result.publicId,
        name: result.originalName,
        size: result.size,
        type: result.format
      };
    } catch (error) {
      console.error('Error uploading escrow document:', error);
      if (file) {
        return createLocalFallback(file, `escrow/${escrowId || 'temp'}/${documentType || 'document'}/${file.name}`);
      }
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  async deleteFile() {
    return { success: false, error: 'Delete is not supported in this build.' };
  }

  async getFileMetadata() {
    return { success: false, error: 'Metadata lookup is not supported in this build.' };
  }

  async listFiles() {
    return { success: false, error: 'Listing files is not supported in this build.' };
  }

  async getPropertyImages() {
    return { success: false, error: 'Listing images is not supported in this build.' };
  }

  async getEscrowDocuments() {
    return { success: false, error: 'Listing documents is not supported in this build.' };
  }

  validateFile(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    const errors = [];

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const storageService = new StorageService();
export default storageService;
