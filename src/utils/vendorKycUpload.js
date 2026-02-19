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

    // Allow unauthenticated uploads for public vendor onboarding (backend accepts public uploads).

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
    const headers = { 'Content-Type': 'multipart/form-data' };

    // Use centralized API client so Authorization + refresh logic is handled consistently
    const apiClient = await import('../services/apiClient').then(m => m.default);

    // Helper: convert File -> data URL (used only for local fallback)
    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

    // Try remote upload first; if storage service is down, fall back to localStorage
    try {
      const response = await apiClient.post(
        '/upload/vendor/kyc',
        formData,
        {
          headers,
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
      }

      // If response did not indicate success, throw to trigger fallback handling below
      throw new Error(response.data?.message || 'Upload failed');
    } catch (err) {
      // Normalize error details
      const status = err?.response?.status;
      const msg = (err?.response?.data?.message || err?.message || '').toString();

      // Treat network failures and server (5xx) errors as eligible for local fallback.
      const shouldLocalFallback = !status || (status >= 500 && status < 600) || /file upload service is not configured|upload service not configured|storage service not configured|service unavailable|network error|failed to fetch/i.test(msg);

      if (!shouldLocalFallback) {
        // Propagate non-fallback errors to outer catch
        throw err;
      }

      // Local fallback: store small files as data-URLs in localStorage so onboarding can continue offline
      const MAX_LOCAL_FALLBACK_BYTES = 2.5 * 1024 * 1024; // 2.5MB per file (avoid exceeding localStorage limits)
      const fallbackDocs = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_LOCAL_FALLBACK_BYTES) {
          return {
            success: false,
            error: `File "${file.name}" is too large for local fallback (>${Math.round(MAX_LOCAL_FALLBACK_BYTES / 1024 / 1024)}MB). Please contact the administrator.`
          };
        }
        try {
          const dataUrl = await fileToDataUrl(file);
          const doc = {
            type: file.name.toLowerCase().includes('id') ? 'identity_verification' : 'kyc',
            url: dataUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
            publicId: `local-${Date.now()}-${i}`
          };
          fallbackDocs.push(doc);
        } catch (convErr) {
          console.warn('Failed to convert file to data URL for local fallback', convErr);
          return { success: false, error: `Failed to persist "${file.name}" locally` };
        }
      }

      // Persist fallback documents in localStorage for inspection and later server sync
      try {
        const key = 'vendorKycFallbackUploads';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(existing.concat(fallbackDocs)));
      } catch (storageErr) {
        console.error('Failed to persist fallback KYC uploads to localStorage', storageErr);
        return { success: false, error: 'Failed to persist files locally' };
      }

      return { success: true, data: fallbackDocs, uploadedFiles: fallbackDocs, fallback: 'local-storage' };
    }
  } catch (error) {
    console.error('Error uploading vendor KYC documents:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload documents'
    };
  }
};
