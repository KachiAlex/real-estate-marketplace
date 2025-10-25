import React, { useState, useRef } from 'react';
import { FaUser, FaCamera, FaTimes, FaCheck } from 'react-icons/fa';
import storageService from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AvatarUpload = ({ 
  currentAvatar, 
  onAvatarChange, 
  size = 'large', 
  disabled = false,
  showEditButton = true 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xlarge: 'w-40 h-40'
  };

  const iconSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    xlarge: 'text-4xl'
  };

  const handleFileSelect = async (file) => {
    if (uploading || disabled) return;

    // Validate file
    const validation = storageService.validateFile(
      file, 
      ['image/jpeg', 'image/png', 'image/webp'], 
      5 * 1024 * 1024 // 5MB
    );

    if (!validation.valid) {
      validation.errors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      // Use user ID if available, otherwise use a default ID
      const userId = user?.uid || 'default-user';
      const uploadResult = await storageService.uploadUserAvatar(file, userId);

      if (uploadResult.success) {
        onAvatarChange && onAvatarChange(uploadResult);
        toast.success('Avatar updated successfully!');
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (uploading || disabled) return;

    try {
      // If there's a current avatar, delete it from storage
      if (currentAvatar && currentAvatar.path) {
        await storageService.deleteFile(currentAvatar.path);
      }

      onAvatarChange && onAvatarChange(null);
      setPreview(null);
      toast.success('Avatar removed successfully');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    }
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const displayAvatar = preview || currentAvatar?.url;

  return (
    <div className="avatar-upload">
      <div className="relative inline-block">
        {/* Avatar Display */}
        <div className={`
          ${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg
          ${disabled ? 'opacity-50' : ''}
        `}>
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <FaUser className={`${iconSizes[size]} text-gray-400`} />
            </div>
          )}
        </div>

        {/* Upload Overlay */}
        {!disabled && showEditButton && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group">
            <button
              onClick={openFileDialog}
              disabled={uploading}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
              ) : (
                <FaCamera className="text-gray-700 text-sm" />
              )}
            </button>
          </div>
        )}

        {/* Remove Button */}
        {!disabled && displayAvatar && (
          <button
            onClick={handleRemoveAvatar}
            disabled={uploading}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <FaTimes className="text-xs" />
          </button>
        )}

        {/* Upload Status */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-xs">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload Instructions */}
      {!disabled && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Click to upload new avatar
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, WEBP up to 5MB
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
