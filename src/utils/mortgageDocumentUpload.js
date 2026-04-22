/**
 * Mortgage Document Upload Utility
 * Handles uploading documents for mortgage applications to Cloudinary via backend
 */

import { getAuthToken } from './authToken';

/**
 * Upload mortgage documents to backend (which uploads to Cloudinary)
 * @param {File[]} files - Array of File objects to upload
 * @param {string} applicationId - Optional application ID if application already exists
 * @param {Function} onProgress - Optional progress callback (progress: number) => void
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const uploadMortgageDocuments = async (files, applicationId = null, onProgress = null) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const accessToken = await getAuthToken();
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    const apiClient = (await import('../services/apiClient')).default;

    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    const invalidFiles = files.filter(file => {
      if (file.size > maxSize) {
        return `File ${file.name} exceeds 10MB limit`;
      }
      if (!allowedTypes.includes(file.type)) {
        return `File ${file.name} has invalid type`;
      }
      return null;
    });

    if (invalidFiles.length > 0) {
      throw new Error(`Invalid files: ${invalidFiles.join(', ')}`);
    }

    // Create FormData
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    if (applicationId) {
      formData.append('applicationId', applicationId);
    }

    // Upload to backend
    const response = await apiClient.post(
      '/upload/mortgage/documents',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      }
    );

    if (response.data && response.data.success) {
      // Transform uploaded files to document format expected by backend
      const documents = response.data.data.uploaded.map((file, index) => ({
        type: 'bank_statement', // Default type, can be enhanced later
        url: file.url,
        name: files[index].name,
        uploadedAt: new Date().toISOString(),
        publicId: file.publicId
      }));

      return {
        success: true,
        data: documents,
        uploadedFiles: response.data.data.uploaded
      };
    } else {
      throw new Error(response.data?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading mortgage documents:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload documents'
    };
  }
};

/**
 * Upload a single document
 * @param {File} file - File to upload
 * @param {string} applicationId - Optional application ID
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const uploadSingleMortgageDocument = async (file, applicationId = null, onProgress = null) => {
  const result = await uploadMortgageDocuments([file], applicationId, onProgress);
  
  if (result.success) {
    return {
      success: true,
      data: result.data[0]
    };
  }
  
  return result;
};

