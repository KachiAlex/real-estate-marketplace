import React from 'react';
import EnhancedFileUpload from './EnhancedFileUpload';

const PropertyVideoUpload = ({ 
  propertyId, 
  onVideosChange, 
  initialVideos = [], 
  maxVideos = 5,
  disabled = false,
  className = ''
}) => {
  return (
    <EnhancedFileUpload
      propertyId={propertyId}
      onFilesChange={onVideosChange}
      initialFiles={initialVideos}
      maxFiles={maxVideos}
      maxSize={100 * 1024 * 1024} // 100MB
      allowedTypes={['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']}
      type="video"
      disabled={disabled}
      className={className}
    />
  );
};

export default PropertyVideoUpload;
