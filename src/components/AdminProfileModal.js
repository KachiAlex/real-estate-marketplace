import React, { useState } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaShieldAlt, FaCalendarAlt, FaCamera, FaEdit, FaSave, FaPhone } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';


const AdminProfileModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', bio: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch profile on open
  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch admin profile');
        const json = await res.json();
        setFormData(json.data || {});
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.put('/admin/profile', formData);
      if (!res?.data?.success) throw new Error(res?.data?.message || 'Failed to update profile');
      setIsEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLoading(true);
    setError(null);
    // Re-fetch profile to reset form
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch admin profile');
        const json = await res.json();
        setFormData(json.data || {});
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  };


  if (!isOpen) return null;
  if (loading) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-12 text-center">Loading profile...</div></div>;
  }
  if (error) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-12 text-center text-red-500">{error}</div></div>;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'activity', label: 'Activity', icon: FaCalendarAlt }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Admin Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {formData.avatar ? (
                  <img 
                    src={formData.avatar} 
                    alt={`${formData.firstName} ${formData.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  `${formData.firstName?.[0]?.toUpperCase() || 'A'}${formData.lastName?.[0]?.toUpperCase() || 'D'}`
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors">
                  <FaCamera className="text-xs" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-sm text-gray-600">{formData.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <FaShieldAlt className="mr-1" />
                  Administrator
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <FaSave className="mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <FaEdit className="mr-1" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex items-center space-x-2">
                  <FaEnvelope className="text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex items-center space-x-2">
                  <FaPhone className="text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !isEditing ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Security Settings</h4>
                <p className="text-sm text-yellow-700">
                  Admin accounts have elevated privileges. Ensure your password is strong and enable two-factor authentication.
                </p>
              </div>
              
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">Change Password</h4>
                      <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                    </div>
                    <FaUser className="text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Not enabled</p>
                    </div>
                    <FaShieldAlt className="text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Approved property verification</p>
                    <p className="text-xs text-gray-600">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Updated blog post</p>
                    <p className="text-xs text-gray-600">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Reviewed user dispute</p>
                    <p className="text-xs text-gray-600">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {user?.firstName} {user?.lastName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="p-3 bg-gray-50 rounded-lg flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="p-3 bg-gray-50 rounded-lg flex items-center">
                  <FaShieldAlt className="mr-2 text-red-500" />
                  System Administrator
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <div className="p-3 bg-green-50 rounded-lg text-green-800 font-medium">
                  Active
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Security Information</h4>
                <p className="text-sm text-blue-700">
                  Your admin account has elevated privileges. Ensure you follow security best practices.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Change Password
              </button>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <FaCalendarAlt className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>Activity tracking will be implemented in a future update.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;
