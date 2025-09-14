import React, { useState, useRef } from 'react';
import { FaUpload, FaTimes, FaImage, FaFile, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import storageService from '../services/storageService';
import toast from 'react-hot-toast';

const FileUpload = ({
  onUpload,
  onRemove,
  files = [],
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  uploadPath = '',
  uploadType = 'general', // 'property_images', 'user_avatar', 'escrow_document'
  metadata = {},
  disabled = false,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (selectedFiles) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check if adding these files would exceed maxFiles limit
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach(file => {
      const validation = storageService.validateFile(file, allowedTypes, maxSize);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, errors: validation.errors });
      }
    });

    // Show validation errors
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          toast.error(`${file.name}: ${error}`);
        });
      });
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      let uploadResult;

      switch (uploadType) {
        case 'property_images':
          uploadResult = await storageService.uploadPropertyImages(
            validFiles, 
            metadata.propertyId, 
            metadata.userId
          );
          break;
        case 'user_avatar':
          uploadResult = await storageService.uploadUserAvatar(
            validFiles[0], 
            metadata.userId
          );
          break;
        case 'escrow_document':
          uploadResult = await storageService.uploadEscrowDocument(
            validFiles[0],
            metadata.escrowId,
            metadata.documentType,
            metadata.userId
          );
          break;
        default:
          uploadResult = await storageService.uploadMultipleFiles(
            validFiles, 
            uploadPath, 
            metadata
          );
      }

      if (uploadResult.success) {
        if (uploadType === 'user_avatar' || uploadType === 'escrow_document') {
          // Single file uploads
          onUpload && onUpload(uploadResult);
        } else {
          // Multiple file uploads
          onUpload && onUpload(uploadResult.successful);
        }
        toast.success(`${validFiles.length} file(s) uploaded successfully!`);
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = (fileIndex) => {
    if (disabled || uploading) return;
    onRemove && onRemove(fileIndex);
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) {
      return <FaImage className="text-blue-500" />;
    }
    return <FaFile className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    return storageService.formatFileSize(bytes);
  };

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-brand-blue bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${uploading ? 'pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={uploadType !== 'user_avatar' && uploadType !== 'escrow_document'}
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="space-y-2">
          <FaUpload className={`mx-auto text-2xl ${dragOver ? 'text-brand-blue' : 'text-gray-400'}`} />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Uploading files...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-blue h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                {allowedTypes.includes('image/') ? 'Images' : 'Files'} up to {formatFileSize(maxSize)}
              </p>
              {maxFiles > 1 && (
                <p className="text-xs text-gray-500">
                  Maximum {maxFiles} files
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name || file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size || file.fileSize)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:text-brand-orange text-sm"
                    >
                      View
                    </a>
                  )}
                  
                  {!disabled && !uploading && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue"></div>
            <span className="text-sm text-blue-700">Uploading files...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
