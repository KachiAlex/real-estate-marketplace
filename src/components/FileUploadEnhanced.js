import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiFile, FiImage, FiVideo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Enhanced File Upload Component
 * Supports images, videos, and documents with progress tracking
 */
const FileUploadEnhanced = ({
  uploadType = 'images', // 'images', 'videos', 'documents', 'avatar'
  propertyId = null,
  maxFiles = 10,
  maxSize = 10, // MB
  onUploadComplete,
  onUploadError,
  existingFiles = [],
  showPreview = true,
  multiple = true
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState(existingFiles);
  const fileInputRef = useRef(null);

  // Determine accepted file types
  const getAcceptedTypes = () => {
    switch (uploadType) {
      case 'images':
        return 'image/jpeg,image/jpg,image/png,image/webp,image/gif';
      case 'videos':
        return 'video/mp4,video/quicktime,video/x-msvideo,video/webm';
      case 'documents':
        return 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
      case 'avatar':
        return 'image/jpeg,image/jpg,image/png,image/webp';
      default:
        return '*/*';
    }
  };

  // Validate file
  const validateFile = (file) => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return `File ${file.name} exceeds maximum size of ${maxSize}MB`;
    }

    const acceptedTypes = getAcceptedTypes().split(',');
    if (!acceptedTypes.includes(file.type) && !acceptedTypes.includes('*/*')) {
      return `File ${file.name} has invalid type`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Validate total file count
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = [];
    for (const file of selectedFiles) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending'
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Delete uploaded file
  const deleteUploadedFile = async (publicId, fileIndex) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/api/upload/${encodeURIComponent(publicId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  // Upload files
  const uploadFiles = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!propertyId && uploadType !== 'avatar') {
      toast.error('Property ID is required');
      return;
    }

    setUploading(true);
    const formData = new FormData();

    // Determine endpoint and field name
    let endpoint = '';
    let fieldName = '';

    switch (uploadType) {
      case 'images':
        endpoint = `/api/upload/property/${propertyId}/images`;
        fieldName = 'images';
        break;
      case 'videos':
        endpoint = `/api/upload/property/${propertyId}/videos`;
        fieldName = 'videos';
        break;
      case 'documents':
        endpoint = `/api/upload/property/${propertyId}/documents`;
        fieldName = 'documents';
        break;
      case 'avatar':
        endpoint = '/api/upload/avatar';
        fieldName = 'avatar';
        break;
      default:
        toast.error('Invalid upload type');
        setUploading(false);
        return;
    }

    // Append files to form data
    if (uploadType === 'avatar') {
      formData.append(fieldName, files[0].file);
    } else {
      files.forEach(fileObj => {
        formData.append(fieldName, fileObj.file);
      });
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            total: percentCompleted
          }));
        }
      });

      if (response.data.success) {
        const newFiles = Array.isArray(response.data.data.uploaded) 
          ? response.data.data.uploaded 
          : [response.data.data];

        setUploadedFiles(prev => [...prev, ...newFiles]);
        setFiles([]);
        setUploadProgress({});
        toast.success(response.data.message || 'Files uploaded successfully');

        if (onUploadComplete) {
          onUploadComplete(newFiles);
        }
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to upload files';
      toast.error(message);

      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  }, [files, propertyId, uploadType, onUploadComplete, onUploadError]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <FiImage className="text-blue-500" size={24} />;
    if (type.startsWith('video/')) return <FiVideo className="text-purple-500" size={24} />;
    return <FiFile className="text-gray-500" size={24} />;
  };

  return (
    <div className="w-full space-y-4">
      {/* File Input Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          multiple={multiple && uploadType !== 'avatar'}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <FiUpload className="mx-auto text-gray-400 mb-4" size={48} />
        
        <p className="text-gray-600 mb-2">
          {uploadType === 'avatar' ? 'Upload your avatar' : `Upload ${uploadType}`}
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          Max {maxFiles} file{maxFiles > 1 ? 's' : ''} • {maxSize}MB per file
        </p>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={uploading}
        >
          Choose Files
        </button>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Selected Files</h3>
          
          {files.map(fileObj => (
            <div key={fileObj.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {showPreview && fileObj.preview ? (
                <img
                  src={fileObj.preview}
                  alt={fileObj.name}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded">
                  {getFileIcon(fileObj.type)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fileObj.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileObj.size)}</p>
              </div>
              
              <button
                type="button"
                onClick={() => removeFile(fileObj.id)}
                className="text-red-500 hover:text-red-700"
                disabled={uploading}
              >
                <FiX size={20} />
              </button>
            </div>
          ))}

          {/* Upload Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Uploading... {uploadProgress.total || 0}%
                </>
              ) : (
                'Upload Files'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setFiles([])}
              disabled={uploading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Uploaded Files ({uploadedFiles.length})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.thumbnail || file.url ? (
                  <img
                    src={file.thumbnail || file.url}
                    alt={file.originalName || `Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-200 rounded-lg">
                    {getFileIcon(file.format || 'file')}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => deleteUploadedFile(file.publicId, index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Delete file"
                >
                  <FiX size={16} />
                </button>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {formatFileSize(file.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadEnhanced;

