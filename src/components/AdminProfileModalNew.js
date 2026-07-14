import React, { useState } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaShieldAlt, FaCalendarAlt, FaCamera, FaEdit, FaSave, FaPhone } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const AdminProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving admin profile:', formData);
    setIsEditing(false);
    // You could update the user context here
    // updateUser({ ...user, ...formData });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

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
