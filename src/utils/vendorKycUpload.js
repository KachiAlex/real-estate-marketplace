import axios from 'axios';
import { getApiUrl } from './apiConfig';

/**
 * Upload vendor KYC documents to backend (Render API)
 * @param {File[]} files - Array of File objects to upload
 * @param {Function} onProgress - Optional progress callback (progress: number) => void
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const uploadVendorKycDocuments = async (files, onProgress = null) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

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

    const invalidFiles = files.filter(file => file.size > maxSize || !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      throw new Error(`Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
    }

    // Create FormData
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    // Upload to backend (Render API)
    const response = await axios.post(
      getApiUrl('/upload/vendor/kyc'),
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
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
        type: files[index].name.toLowerCase().includes('id') ? 'identity_verification' : 'kyc',
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
    console.error('Error uploading vendor KYC documents:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload documents'
    };
  }
};
