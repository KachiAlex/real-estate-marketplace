import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaCamera, FaTimes, FaUpload } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import storageService from '../services/storageService';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../config/firebase';

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
  // But don't overwrite if we have a preview that's different (user just uploaded)
  useEffect(() => {
    if (user) {
      // Check localStorage for a saved avatar (data URL from local upload)
      let savedAvatar = null;
      try {
        const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUserData.avatar && currentUserData.avatar.startsWith('data:')) {
          savedAvatar = currentUserData.avatar;
        }
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
      
      // Prioritize saved local avatar, then user avatar, then empty
      const avatarToUse = savedAvatar || user?.avatar || '';
      
      // Only update avatar if we don't have a preview or if the avatar changed
      const shouldUpdateAvatar = !avatarPreview || (avatarToUse && avatarToUse !== avatarPreview);
      
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || user?.user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        avatar: avatarToUse
      });
      
      if (shouldUpdateAvatar) {
        setAvatarPreview(avatarToUse || null);
      }
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
      // Use avatarPreview if available (from recent upload), otherwise use formData.avatar
      const avatarToSave = avatarPreview && !avatarPreview.startsWith('data:') ? avatarPreview : (formData.avatar || user?.avatar || '');
      
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
              avatar: avatarToSave
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data.success) {
            // Use the avatar from the response if available, otherwise use what we sent
            const updatedAvatar = response.data.user?.avatar || response.data.data?.avatar || avatarToSave;
            await updateUserProfile({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              avatar: updatedAvatar
            });
            // Update formData and preview to ensure consistency
            setFormData(prev => ({ ...prev, avatar: updatedAvatar }));
            setAvatarPreview(updatedAvatar);
          }
        } catch (apiError) {
          console.error('API update failed, using local update:', apiError);
          // Fallback to local update
          await updateUserProfile({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            avatar: avatarToSave
          });
          // Update formData and preview
          setFormData(prev => ({ ...prev, avatar: avatarToSave }));
          setAvatarPreview(avatarToSave);
        }
      } else {
        // No token, use local update only
        await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          avatar: avatarToSave
        });
        // Update formData and preview
        setFormData(prev => ({ ...prev, avatar: avatarToSave }));
        setAvatarPreview(avatarToSave);
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

    // Create preview immediately for better UX and get local data URL
    const localDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
        resolve(event.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setUploadingAvatar(true);

    try {
      const currentUser = auth.currentUser || user;
      const userId = currentUser?.uid || currentUser?.id || user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Upload to Firebase Storage
      const uploadResult = await storageService.uploadUserAvatar(file, userId);

      let avatarUrl;
      
      if (!uploadResult.success) {
        // If Firebase Storage fails, use local data URL as fallback
        console.error('Firebase Storage upload failed:', uploadResult.error);
        console.log('Using local data URL as fallback');
        avatarUrl = localDataUrl;
        
        // Still try to save to Firestore with local URL
        try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, {
            avatar: avatarUrl,
            updatedAt: serverTimestamp(),
            isLocalAvatar: true // Flag to indicate this is a local URL
          }, { merge: true });
          console.log('Saved local avatar to Firestore');
        } catch (firestoreError) {
          console.error('Firestore update error:', firestoreError);
        }
        
        // Update local state with local URL
        // Save to localStorage directly to ensure persistence
        try {
          const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const updatedUser = { ...currentUserData, avatar: avatarUrl };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          console.log('Saved avatar to localStorage:', avatarUrl.substring(0, 50) + '...');
        } catch (localError) {
          console.error('Error saving to localStorage:', localError);
        }
        
        // Try to update via updateUserProfile (may fail due to Firestore permissions, but that's ok)
        try {
          await updateUserProfile({ avatar: avatarUrl });
        } catch (profileError) {
          console.warn('updateUserProfile failed (expected due to permissions):', profileError);
          // Continue anyway - we've saved to localStorage
        }
        
        setFormData(prev => ({ ...prev, avatar: avatarUrl }));
        setAvatarPreview(avatarUrl);
        toast.error('Profile picture saved locally. Cloud upload failed - check Firebase Storage permissions.');
        return; // Exit early since we're using local fallback
      }

      avatarUrl = uploadResult.url;
      console.log('Firebase Storage upload successful:', avatarUrl);

      // Save to Firestore
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          avatar: avatarUrl,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        // Continue even if Firestore update fails
      }

      // Update backend API if token exists
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.put(
            `${API_BASE_URL}/api/auth/profile`,
            { avatar: avatarUrl },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
        } catch (apiError) {
          console.error('Backend API update error:', apiError);
          // Continue even if backend update fails
        }
      }

      // Update local state
      await updateUserProfile({ avatar: avatarUrl });
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
      setAvatarPreview(avatarUrl);
      toast.success('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      
      let errorMessage = 'Failed to upload profile picture';
      
      if (error.code === 'storage/unauthorized' || error.message?.includes('permission')) {
        errorMessage = 'Storage permission denied. Please check your Firebase Storage rules.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Revert preview on error
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
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-blue-600 text-lg tracking-wider">{user?.userCode || 'PAK-XXXXXX'}</p>
                    <button
                      onClick={async (e) => {
                        const button = e.currentTarget;
                        const originalText = button.textContent;
                        try {
                          const textToCopy = user?.userCode || '';
                          if (!textToCopy) {
                            toast.error('User ID not available');
                            return;
                          }
                          
                          await navigator.clipboard.writeText(textToCopy);
                          button.textContent = 'Copied!';
                          button.classList.add('bg-green-100', 'text-green-700');
                          button.classList.remove('bg-blue-100', 'text-blue-700');
                          
                          toast.success(`User ID "${textToCopy}" copied!`, {
                            icon: '✅',
                            duration: 3000,
                            style: {
                              background: '#10b981',
                              color: '#fff',
                            },
                          });
                          
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.classList.remove('bg-green-100', 'text-green-700');
                            button.classList.add('bg-blue-100', 'text-blue-700');
                          }, 2000);
                        } catch (err) {
                          // Fallback for older browsers
                          const textToCopy = user?.userCode || '';
                          if (!textToCopy) {
                            toast.error('User ID not available');
                            return;
                          }
                          
                          const textArea = document.createElement('textarea');
                          textArea.value = textToCopy;
                          textArea.style.position = 'fixed';
                          textArea.style.opacity = '0';
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          
                          button.textContent = 'Copied!';
                          button.classList.add('bg-green-100', 'text-green-700');
                          button.classList.remove('bg-blue-100', 'text-blue-700');
                          
                          toast.success(`User ID "${textToCopy}" copied!`, {
                            icon: '✅',
                            duration: 3000,
                            style: {
                              background: '#10b981',
                              color: '#fff',
                            },
                          });
                          
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.classList.remove('bg-green-100', 'text-green-700');
                            button.classList.add('bg-blue-100', 'text-blue-700');
                          }, 2000);
                        }
                      }}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {/* Vendor ID - only shown if user is a vendor */}
                {user?.vendorCode && user?.roles?.includes('vendor') && (
                  <div>
                    <span className="text-sm text-gray-500">Vendor ID</span>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-green-600 text-lg tracking-wider">{user.vendorCode}</p>
                      <button
                        onClick={async (e) => {
                          const button = e.currentTarget;
                          const originalText = button.textContent;
                          try {
                            const textToCopy = user.vendorCode || '';
                            if (!textToCopy) {
                              toast.error('Vendor ID not available');
                              return;
                            }
                            
                            await navigator.clipboard.writeText(textToCopy);
                            button.textContent = 'Copied!';
                            button.classList.add('bg-blue-100', 'text-blue-700');
                            button.classList.remove('bg-green-100', 'text-green-700');
                            
                            toast.success(`Vendor ID "${textToCopy}" copied!`, {
                              icon: '✅',
                              duration: 3000,
                              style: {
                                background: '#10b981',
                                color: '#fff',
                              },
                            });
                            
                            setTimeout(() => {
                              button.textContent = originalText;
                              button.classList.remove('bg-blue-100', 'text-blue-700');
                              button.classList.add('bg-green-100', 'text-green-700');
                            }, 2000);
                          } catch (err) {
                            // Fallback for older browsers
                            const textToCopy = user.vendorCode || '';
                            if (!textToCopy) {
                              toast.error('Vendor ID not available');
                              return;
                            }
                            
                            const textArea = document.createElement('textarea');
                            textArea.value = textToCopy;
                            textArea.style.position = 'fixed';
                            textArea.style.opacity = '0';
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            
                            button.textContent = 'Copied!';
                            button.classList.add('bg-blue-100', 'text-blue-700');
                            button.classList.remove('bg-green-100', 'text-green-700');
                            
                            toast.success(`Vendor ID "${textToCopy}" copied!`, {
                              icon: '✅',
                              duration: 3000,
                              style: {
                                background: '#10b981',
                                color: '#fff',
                              },
                            });
                            
                            setTimeout(() => {
                              button.textContent = originalText;
                              button.classList.remove('bg-blue-100', 'text-blue-700');
                              button.classList.add('bg-green-100', 'text-green-700');
                            }, 2000);
                          }
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Share this with buyers to find your properties</p>
                  </div>
                )}
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