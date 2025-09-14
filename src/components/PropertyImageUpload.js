import React, { useState } from 'react';
import { FaImage, FaTimes, FaUpload, FaEye } from 'react-icons/fa';
import storageService from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PropertyImageUpload = ({ 
  propertyId, 
  onImagesChange, 
  initialImages = [], 
  maxImages = 10,
  disabled = false 
}) => {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const { user } = useAuth();

  const handleImageUpload = async (files) => {
    if (!user || uploading || disabled) return;

    const fileArray = Array.from(files);
    
    // Check if adding these images would exceed maxImages limit
    if (images.length + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate images
    const validImages = [];
    const invalidImages = [];

    fileArray.forEach(file => {
      const validation = storageService.validateFile(
        file, 
        ['image/jpeg', 'image/png', 'image/webp'], 
        10 * 1024 * 1024 // 10MB for images
      );
      
      if (validation.valid) {
        validImages.push(file);
      } else {
        invalidImages.push({ file, errors: validation.errors });
      }
    });

    // Show validation errors
    if (invalidImages.length > 0) {
      invalidImages.forEach(({ file, errors }) => {
        errors.forEach(error => {
          toast.error(`${file.name}: ${error}`);
        });
      });
    }

    if (validImages.length === 0) return;

    setUploading(true);

    try {
      const uploadResult = await storageService.uploadPropertyImages(
        validImages,
        propertyId || 'temp',
        user.uid
      );

      if (uploadResult.success) {
        const newImages = uploadResult.successful.map(result => ({
          id: Date.now() + Math.random(),
          url: result.url,
          name: result.name,
          size: result.size,
          path: result.path,
          isUploaded: true
        }));

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange && onImagesChange(updatedImages);
        toast.success(`${validImages.length} image(s) uploaded successfully!`);
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (index) => {
    if (disabled || uploading) return;

    const imageToRemove = images[index];
    
    // If it's an uploaded image, delete from storage
    if (imageToRemove.isUploaded && imageToRemove.path) {
      try {
        await storageService.deleteFile(imageToRemove.path);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
        // Continue with removal from UI even if storage deletion fails
      }
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange && onImagesChange(updatedImages);
    toast.success('Image removed successfully');
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
    // Reset input value
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  return (
    <div className="property-image-upload">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-brand-blue cursor-pointer'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && document.getElementById('image-upload').click()}
      >
        <input
          id="image-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="space-y-2">
          <FaImage className={`mx-auto text-3xl ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          
          {uploading ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading images...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-blue h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {disabled ? 'Image upload disabled' : 'Click to upload or drag and drop images'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP up to 10MB each
              </p>
              <p className="text-xs text-gray-500">
                {images.length}/{maxImages} images uploaded
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Property Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id || index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
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
                    
                    {!disabled && !uploading && (
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                        title="Remove"
                      >
                        <FaTimes className="text-white text-sm" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Info */}
                <div className="mt-1">
                  <p className="text-xs text-gray-500 truncate">
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {storageService.formatFileSize(image.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewIndex(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all z-10"
            >
              <FaTimes className="text-gray-700" />
            </button>
            
            <img
              src={images[previewIndex]?.url}
              alt={`Property image ${previewIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="text-sm">
                {images[previewIndex]?.name} ({storageService.formatFileSize(images[previewIndex]?.size)})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImageUpload;
