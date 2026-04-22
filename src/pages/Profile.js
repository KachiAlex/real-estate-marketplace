import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BecomeVendorModal from '../components/BecomeVendorModal.js';
import VendorStatusCard from '../components/VendorStatusCard';

import { getApiUrl } from '../utils/apiConfig';
import toast from 'react-hot-toast';
import storageService from '../services/storageService';

const Profile = () => {
  const { currentUser } = useAuth();
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const { accessToken, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || null);

  const bustCache = (url) => {
    if (!url) return url;
    const cacheBuster = `cb=${Date.now()}`;
    return url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
  };

  const onAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (file && !validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatarAndSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = currentUser?.avatar || null;
      
      // Upload avatar if file selected
      if (avatarFile && currentUser?.id) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadResponse = await fetch(getApiUrl('/upload/user/avatar'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Avatar upload failed');
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.success && uploadData.data?.avatarUrl) {
          avatarUrl = uploadData.data.avatarUrl;
        }
      }

      const cacheSafeAvatar = avatarUrl && typeof avatarUrl === 'string' ? bustCache(avatarUrl) : null;

      // Update profile with new data
      const profileResponse = await fetch(getApiUrl('/api/auth/jwt/update-profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          bio,
          avatar: cacheSafeAvatar
        })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Profile update failed');
      }

      const profileData = await profileResponse.json();
      if (profileData.success) {
        // Update context
        await updateUserProfile({
          firstName,
          lastName,
          phone,
          bio,
          avatar: cacheSafeAvatar
        });
        setAvatarPreview(cacheSafeAvatar);
        toast.success('Profile updated successfully');
        setEditing(false);
      } else {
        throw new Error(profileData.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile save error', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isVendor = roles.includes('vendor');
  const isBuyer = roles.includes('buyer');
  const buyerPreferences = currentUser?.buyerData?.preferences || {};
  const buyerSince = currentUser?.buyerData?.buyerSince;


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {isVendor ? (
              <VendorStatusCard onOpenKyc={() => setIsVendorModalOpen(true)} />
            ) : (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm font-medium text-gray-700">Vendor status</div>
                <div className="mt-2 text-xs text-gray-500">Not a vendor</div>
                <div className="mt-4">
                  <button
                    onClick={() => setIsVendorModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-sm font-medium text-white rounded"
                  >
                    Become a vendor
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-700">Buyer status</div>
              <div className="mt-2 text-xs text-gray-500">
                {isBuyer ? 'Buyer features managed via vendor profile' : 'Switch to vendor dashboard to become a buyer'}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-sm text-gray-600">Manage your basic account details below.</p>

              {!currentUser ? (
                <p className="text-sm text-gray-600">No user data available.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="sm:col-span-2 flex items-center gap-4">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-brand-blue text-white flex items-center justify-center font-medium text-2xl">{(currentUser.firstName || currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</div>
                    )}
                    <div>
                      <div className="text-gray-500">Name</div>
                      <div className="font-medium text-gray-900">{(currentUser.firstName || '') + ' ' + (currentUser.lastName || '')}</div>
                      <div className="text-sm text-gray-600">{currentUser.email}</div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">First name</label>
                          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Last name</label>
                          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Phone</label>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="+234..." />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Bio</label>
                          <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Tell us about yourself" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-sm text-gray-600">Profile picture</label>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatarChange} className="mt-1" />
                          <p className="text-xs text-gray-500 mt-1">Max 5MB. Supported: JPEG, PNG, WebP</p>
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <button disabled={saving} onClick={uploadAvatarAndSave} className="btn btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                          <button onClick={() => { setEditing(false); setFirstName(currentUser.firstName || ''); setLastName(currentUser.lastName || ''); setPhone(currentUser.phone || ''); setBio(currentUser.bio || ''); setAvatarFile(null); }} className="btn btn-secondary">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(true)} className="btn btn-primary">Edit profile</button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-500">Role</div>
                    <div className="font-medium text-gray-900">{Array.isArray(currentUser.roles) ? currentUser.roles.join(', ') : (currentUser.role || 'user')}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Member ID</div>
                    <div className="font-mono text-xs text-gray-700 break-words">{currentUser.id}</div>
                  </div>
                  {currentUser.phone && (
                    <div>
                      <div className="text-gray-500">Phone</div>
                      <div className="font-medium text-gray-900">{currentUser.phone}</div>
                    </div>
                  )}
                  {currentUser.bio && (
                    <div className="sm:col-span-2">
                      <div className="text-gray-500">Bio</div>
                      <div className="font-medium text-gray-900">{currentUser.bio}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isVendorModalOpen && (
          <BecomeVendorModal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default Profile;
