import React, { useState, useCallback } from 'react';
import { FaUpload, FaTimes, FaEye, FaPlay, FaFile, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import storageService from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const EnhancedFileUpload = ({ 
  propertyId, 
  onFilesChange, 
  initialFiles = [], 
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [],
  type = 'image', // 'image', 'video', 'document'
  disabled = false,
  className = ''
}) => {
  const [files, setFiles] = useState(initialFiles);
  const [uploadingFiles, setUploadingFiles] = useState(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const { user } = useAuth();

  const getTypeConfig = () => {
    const configs = {
      image: {
        icon: FaUpload,
        accept: 'image/jpeg,image/png,image/webp,image/gif',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maxSize: 10 * 1024 * 1024, // 10MB
        placeholder: 'Click to upload or drag and drop images',
        subtext: 'PNG, JPG, WEBP, GIF up to 10MB each'
      },
      video: {
        icon: FaPlay,
        accept: 'video/mp4,video/webm,video/ogg,video/quicktime',
        allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        maxSize: 100 * 1024 * 1024, // 100MB
        placeholder: 'Click to upload or drag and drop videos',
        subtext: 'MP4, WEBM, OGG, MOV up to 100MB each'
      },
      document: {
        icon: FaFile,
        accept: '.pdf,.doc,.docx,.txt,.rtf,.odt',
        allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text'],
        maxSize: 25 * 1024 * 1024, // 25MB
        placeholder: 'Click to upload or drag and drop documents',
        subtext: 'PDF, DOC, DOCX, TXT, RTF up to 25MB each'
      }
    };
    return configs[type] || configs.image;
  };

  const config = getTypeConfig();
  const finalAllowedTypes = allowedTypes.length > 0 ? allowedTypes : config.allowedTypes;
  const finalMaxSize = maxSize || config.maxSize;

  const handleUpload = useCallback(async (fileList) => {
    if (!user || disabled) return;

    const fileArray = Array.from(fileList);
    
    // Check if adding these files would exceed maxFiles limit
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} ${type}s allowed`);
      return;
    }

    // Validate files
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach(file => {
      const validation = storageService.validateFile(file, finalAllowedTypes, finalMaxSize);
      
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

    // Upload files with progress tracking
    for (const file of validFiles) {
      const fileId = `${Date.now()}_${Math.random()}`;
      
      // Add to uploading state
      setUploadingFiles(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: 'uploading'
      }));

      try {
        const uploadResult = await uploadFileWithProgress(file, propertyId || 'temp', user.uid, fileId);
        
        if (uploadResult.success) {
          const newFile = {
            id: Date.now() + Math.random(),
            url: uploadResult.url,
            name: uploadResult.name,
            size: uploadResult.size,
            path: uploadResult.path,
            type: uploadResult.type,
            // Treat Firebase uploads as "uploaded" and local fallbacks as non-uploaded
            isUploaded: !uploadResult.isLocal
          };

          setFiles(prev => [...prev, newFile]);
          onFilesChange && onFilesChange([...files, newFile]);
          
          // Update progress to complete
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.set(fileId, { ...newMap.get(fileId), progress: 100, status: 'completed' });
            return newMap;
          });

          // Remove from uploading state after a delay
          setTimeout(() => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileId);
              return newMap;
            });
          }, 2000);

          toast.success(`${file.name} uploaded successfully!`);
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } catch (error) {
        console.error('File upload error:', error);
        
        // Update progress to error
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(fileId, { ...newMap.get(fileId), status: 'error' });
          return newMap;
        });

        toast.error(`Failed to upload ${file.name}`);
        
        // Remove from uploading state after a delay
        setTimeout(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
        }, 3000);
      }
    }
  }, [user, disabled, files, maxFiles, type, finalAllowedTypes, finalMaxSize, propertyId, onFilesChange]);

  const uploadFileWithProgress = async (file, propertyId, userId, fileId) => {
    const basePath = `properties/${propertyId}/${type}s`;
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = `${basePath}/${fileName}`;
    
    const metadata = {
      customMetadata: {
        propertyId,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        type: `property_${type}`
      }
    };

    try {
      // Create a reference to the file location
      const storageRef = ref(storageService.storage, filePath);
      
      // Upload the file with progress tracking
      const uploadTask = uploadBytes(storageRef, file, metadata);
      
      // Simulate progress updates (Firebase doesn't provide real progress callbacks for uploadBytes)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(fileId);
          if (current && current.status === 'uploading') {
            const newProgress = Math.min(current.progress + Math.random() * 20, 90);
            newMap.set(fileId, { ...current, progress: newProgress });
          }
          return newMap;
        });
      }, 200);

      const snapshot = await uploadTask;
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        name: file.name,
        size: file.size,
        type: file.type,
        isLocal: false
      };
    } catch (error) {
      console.error('Error uploading file:', error);

      // Fallback for documents: use a local object URL so the flow still works in demo mode
      if (type === 'document') {
        const localUrl = URL.createObjectURL(file);
        console.warn('Falling back to local document storage for:', file.name);
        return {
          success: true,
          url: localUrl,
          path: `local-documents/${fileId}`,
          name: file.name,
          size: file.size,
          type: file.type,
          isLocal: true
        };
      }

      return {
        success: false,
        error: error.message
      };
    }
  };

  const handleRemoveFile = async (index) => {
    if (disabled) return;

    const fileToRemove = files[index];
    
    // If it's an uploaded file, delete from storage
    if (fileToRemove.isUploaded && fileToRemove.path) {
      try {
        await storageService.deleteFile(fileToRemove.path);
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        // Continue with removal from UI even if storage deletion fails
      }
    }

    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange && onFilesChange(updatedFiles);
    toast.success('File removed successfully');
  };

  const handleFileSelect = (e) => {
    const fileList = e.target.files;
    if (fileList.length > 0) {
      handleUpload(fileList);
    }
    // Reset input value
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const fileList = e.dataTransfer.files;
    if (fileList.length > 0) {
      handleUpload(fileList);
    }
  };

  const renderPreview = (file, index) => {
    if (type === 'image') {
      return (
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={file.url}
            alt={`${type} ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else if (type === 'video') {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
          <video
            src={file.url}
            className="w-full h-full object-cover"
            controls={false}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <FaPlay className="text-white text-2xl" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <FaFile className="text-gray-400 text-3xl" />
        </div>
      );
    }
  };

  const renderUploadingFiles = () => {
    const uploadingArray = Array.from(uploadingFiles.values());
    if (uploadingArray.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Uploading ({uploadingArray.length})
        </h4>
        <div className="space-y-3">
          {uploadingArray.map((uploadingFile, index) => (
            <div key={`uploading_${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {uploadingFile.status === 'completed' ? (
                  <FaCheck className="text-green-500" />
                ) : uploadingFile.status === 'error' ? (
                  <FaExclamationTriangle className="text-red-500" />
                ) : (
                  <config.icon className="text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadingFile.file.name}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      uploadingFile.status === 'completed' ? 'bg-green-500' :
                      uploadingFile.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${uploadingFile.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {uploadingFile.status === 'completed' ? 'Upload complete' :
                   uploadingFile.status === 'error' ? 'Upload failed' :
                   `${Math.round(uploadingFile.progress)}% uploaded`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreviewModal = () => {
    if (previewIndex === null) return null;

    const file = files[previewIndex];
    if (!file) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all z-10"
          >
            <FaTimes className="text-gray-700" />
          </button>
          
          {type === 'image' ? (
            <img
              src={file.url}
              alt={`${type} ${previewIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : type === 'video' ? (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full rounded-lg"
            />
          ) : (
            <div className="bg-white rounded-lg p-8 max-w-md">
              <FaFile className="text-gray-400 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 text-center">{file.name}</h3>
              <p className="text-sm text-gray-500 text-center mt-2">
                {storageService.formatFileSize(file.size)}
              </p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 text-center text-blue-600 hover:text-blue-800"
              >
                Download File
              </a>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
            <p className="text-sm">
              {file.name} ({storageService.formatFileSize(file.size)})
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`enhanced-file-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 
            dragActive ? 'border-brand-blue bg-blue-50' : 'border-gray-300 hover:border-brand-blue cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById(`${type}-upload`).click()}
      >
        <input
          id={`${type}-upload`}
          type="file"
          multiple
          accept={config.accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-2">
          <config.icon className={`mx-auto text-3xl ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              {disabled ? `${type} upload disabled` : config.placeholder}
            </p>
            <p className="text-xs text-gray-500">
              {config.subtext}
            </p>
            <p className="text-xs text-gray-500">
              {files.length}/{maxFiles} {type}s uploaded
            </p>
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      {renderUploadingFiles()}

      {/* Files Grid */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {type.charAt(0).toUpperCase() + type.slice(1)}s ({files.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={file.id || index} className="relative group">
                {renderPreview(file, index)}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button
                      onClick={() => setPreviewIndex(index)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      title="Preview"
                    >
                      <FaEye className="text-gray-700 text-sm" />
                    </button>
                    
                    {!disabled && (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                        title="Remove"
                      >
                        <FaTimes className="text-white text-sm" />
                      </button>
                    )}
                  </div>
                </div>

                {/* File Info */}
                <div className="mt-1">
                  <p className="text-xs text-gray-500 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {storageService.formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
};

export default EnhancedFileUpload;
