class StorageService {
  async uploadFile(file, path, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', 'generic');
      formData.append('metadata', JSON.stringify({ path, ...metadata }));

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Upload failed');
      }

      return {
        success: true,
        url: result.data?.url,
        path: result.data?.publicId || path,
        name: result.data?.originalName || file.name,
        size: result.data?.size || file.size,
        type: result.data?.format || file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  async uploadMultipleFiles(files, basePath, metadata = {}) {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('uploadType', 'multiple');
      formData.append('metadata', JSON.stringify({ basePath, ...metadata }));

      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Upload failed');
      }

      return {
        success: true,
        successful: result.data?.successful || [],
        failed: result.data?.failed || [],
        total: result.data?.total || files.length
      };
    } catch (error) {
      console.error('Error uploading multiple files:', error);
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
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('uploadType', 'property_images');
      formData.append('metadata', JSON.stringify({
        propertyId,
        userId
      }));

      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Upload failed');
      }

      return {
        success: true,
        successful: result.data?.successful || [],
        failed: result.data?.failed || [],
        total: result.data?.total || files.length
      };
    } catch (error) {
      console.error('Error uploading property images:', error);
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
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('uploadType', 'user_avatar');
      formData.append('metadata', JSON.stringify({ path, userId }));

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Upload failed');
      }

      const avatarInfo = {
        userId,
        avatarUrl: result.data?.url,
        uploadDate: new Date().toISOString(),
        fileName: result.data?.originalName || file.name
      };
      localStorage.setItem(`user_avatar_${userId}`, JSON.stringify(avatarInfo));

      return {
        success: true,
        url: result.data?.url,
        path: result.data?.publicId || path,
        name: result.data?.originalName || file.name,
        size: result.data?.size || file.size,
        type: result.data?.format || file.type
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', 'escrow_document');
      formData.append('metadata', JSON.stringify({
        escrowId,
        documentType,
        userId
      }));

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Upload failed');
      }

      return {
        success: true,
        url: result.data?.url,
        path: result.data?.publicId,
        name: result.data?.originalName,
        size: result.data?.size,
        type: result.data?.format
      };
    } catch (error) {
      console.error('Error uploading escrow document:', error);
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
