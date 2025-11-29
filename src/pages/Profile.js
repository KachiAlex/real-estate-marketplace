import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaCamera, FaTimes, FaUpload } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || user?.user?.email || '', // Use login email from auth
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Sync form data and avatar preview when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || user?.user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        avatar: user?.avatar || ''
      });
      setAvatarPreview(user?.avatar || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    // Email validation removed - email cannot be changed
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Update profile via backend API if available, otherwise use local update
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.put(
            `${API_BASE_URL}/api/auth/profile`,
            {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              avatar: formData.avatar
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data.success) {
            await updateUserProfile({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              avatar: formData.avatar
            });
          }
        } catch (apiError) {
          console.error('API update failed, using local update:', apiError);
          // Fallback to local update
          await updateUserProfile({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            avatar: formData.avatar
          });
        }
      } else {
        // No token, use local update only
        await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          avatar: formData.avatar
        });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setErrors({ general: error.message });
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WEBP, or GIF)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setUploadingAvatar(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please log in to upload a profile picture');
        setAvatarPreview(user?.avatar || null);
        setUploadingAvatar(false);
        return;
      }

      const formDataToUpload = new FormData();
      formDataToUpload.append('avatar', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/upload/avatar`,
        formDataToUpload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data.success) {
        const avatarUrl = response.data.data?.url || response.data.data?.secure_url;
        
        if (!avatarUrl) {
          throw new Error('Avatar URL not received from server');
        }

        // Update profile via backend API to persist the avatar
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const profileResponse = await axios.put(
              `${API_BASE_URL}/api/auth/profile`,
              { avatar: avatarUrl },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (profileResponse.data.success && profileResponse.data.user) {
              // Update local state with the user data from backend
              await updateUserProfile({ avatar: profileResponse.data.user.avatar || avatarUrl });
            } else {
              // Fallback: update local state even if backend update fails
              await updateUserProfile({ avatar: avatarUrl });
            }
          } catch (profileError) {
            console.error('Profile update error:', profileError);
            // Still update local state even if backend update fails
            await updateUserProfile({ avatar: avatarUrl });
            toast.error('Avatar uploaded but profile update failed. Please try again.');
            return;
          }
        } else {
          // No token, just update local state
          await updateUserProfile({ avatar: avatarUrl });
        }
        
        // Update form data and preview
        setFormData(prev => ({ ...prev, avatar: avatarUrl }));
        setAvatarPreview(avatarUrl);
        toast.success('Profile picture uploaded successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      
      let errorMessage = 'Failed to upload profile picture';
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 404) {
          errorMessage = 'Avatar upload endpoint not found. Please contact support.';
        } else if (error.response.status === 401) {
          errorMessage = 'Please log in to upload a profile picture';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to upload avatars';
        } else if (error.response.status === 413) {
          errorMessage = 'File is too large. Maximum size is 5MB';
        } else {
          errorMessage = error.response.data?.message || `Upload failed (${error.response.status})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Failed to upload profile picture';
      }
      
      toast.error(errorMessage);
      // Revert preview to current user avatar
      setAvatarPreview(user?.avatar || null);
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setFormData(prev => ({ ...prev, avatar: '' }));
      setAvatarPreview(null);
      await updateUserProfile({ avatar: '' });
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              {/* Profile Picture Upload Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                <div className="flex items-center space-x-6">
                  {/* Avatar Display */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-100">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUser className="text-4xl text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Overlay */}
                    {!uploadingAvatar && (
                      <button
                        type="button"
                        onClick={handleAvatarSelect}
                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                        title="Change profile picture"
                      >
                        <FaCamera className="text-sm" />
                      </button>
                    )}
                    
                    {/* Uploading Indicator */}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-xs">Uploading...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1">
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleAvatarSelect}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <FaUpload className="text-sm" />
                        <span>{avatarPreview ? 'Change Picture' : 'Upload Picture'}</span>
                      </button>
                      
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={uploadingAvatar}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <FaTimes className="text-sm" />
                          <span>Remove Picture</span>
                        </button>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        JPG, PNG, WEBP or GIF. Max size 5MB
                      </p>
                    </div>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {errors.general}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                    Profile updated successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-gray-400 text-xs">(Cannot be changed)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Your email is locked to your login credentials</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Member Since</span>
                  <p className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Account Status</span>
                  <p className="font-medium text-green-600">Active</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">User ID</span>
                  <p className="font-medium text-gray-600">{user?.id}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Notification Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Privacy Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 