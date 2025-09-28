import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import EnhancedFileUpload from './EnhancedFileUpload';
import toast from 'react-hot-toast';

const PropertyImageUpload = ({ 
  propertyId, 
  onImagesChange, 
  initialImages = [], 
  maxImages = 10,
  disabled = false,
  className = ''
}) => {
  const [imageUrl, setImageUrl] = useState('');

  const handleAddImageUrl = () => {
    if (disabled || !imageUrl.trim()) return;
    
    const url = imageUrl.trim();
    
    try {
      // Basic validation
      const isHttp = url.startsWith('http://') || url.startsWith('https://');
      if (!isHttp) {
        toast.error('Please enter a valid http(s) URL');
        return;
      }
      
      // Create a new image object for URL
      const newImage = {
        id: Date.now() + Math.random(),
        url,
        name: url,
        size: 0,
        path: null,
        isUploaded: false
      };
      
      // Get current images and add the new one
      const currentImages = initialImages || [];
      if (currentImages.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }
      
      const updatedImages = [...currentImages, newImage];
      onImagesChange && onImagesChange(updatedImages);
      setImageUrl('');
      toast.success('Image URL added');
    } catch (e) {
      toast.error('Failed to add image URL');
    }
  };

  return (
    <div className={`property-image-upload ${className}`}>
      <EnhancedFileUpload
        propertyId={propertyId}
        onFilesChange={onImagesChange}
        initialFiles={initialImages}
        maxFiles={maxImages}
        maxSize={10 * 1024 * 1024} // 10MB
        allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
        type="image"
        disabled={disabled}
      />

      {/* URL Upload Section */}
      {!disabled && (
        <div className="mt-4">
          <div className="flex gap-3">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL (https://...)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddImageUrl()}
          />
          <button
            type="button"
            onClick={handleAddImageUrl}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!imageUrl.trim()}
          >
              <FaPlus className="text-sm" />
            Add URL
          </button>
        </div>
          <p className="text-xs text-gray-500 mt-2">
            You can add images by uploading files or pasting image URLs
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageUpload;
