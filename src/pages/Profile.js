import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BecomeVendorModal from '../components/BecomeVendorModal.js';
import VendorStatusCard from '../components/VendorStatusCard';

import { getApiUrl } from '../utils/apiConfig';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser } = useAuth();
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const { accessToken, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
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
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const resp = await fetch(getApiUrl('/upload/avatar'), {
          method: 'POST',
          headers,
          body: fd
        });
        const j = await resp.json().catch(() => ({}));
        if (!resp || !resp.ok) throw new Error(j.message || 'Avatar upload failed');

        const responseData = j?.data || {};
        avatarUrl = responseData.secure_url
          || responseData.url
          || responseData?.uploaded?.[0]?.secure_url
          || responseData?.uploaded?.[0]?.url
          || avatarUrl;
      }

      const cacheSafeAvatar = avatarUrl && typeof avatarUrl === 'string' ? bustCache(avatarUrl) : null;

      // Use context helper to update profile so local state syncs
      await updateUserProfile({ firstName, lastName, avatar: cacheSafeAvatar });
      setAvatarPreview(cacheSafeAvatar);
      toast.success('Profile updated');
      setEditing(false);
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
                          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Last name</label>
                          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-sm text-gray-600">Profile picture</label>
                          <input type="file" accept="image/*" onChange={onAvatarChange} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <button disabled={saving} onClick={uploadAvatarAndSave} className="btn btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                          <button onClick={() => { setEditing(false); setFirstName(currentUser.firstName || ''); setLastName(currentUser.lastName || ''); setAvatarFile(null); }} className="btn btn-secondary">Cancel</button>
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
