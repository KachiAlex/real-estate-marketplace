import React, { useState } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaCamera,
  FaBuilding,
  FaCalendarAlt,
  FaStar,
  FaCheck,
  FaUpload
} from 'react-icons/fa';
import AvatarUpload from '../components/AvatarUpload';
import { useAuth } from '../contexts/AuthContext';

const VendorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const { user } = useAuth();

  // Mock vendor profile data
  const [profileData, setProfileData] = useState({
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@naijaluxury.com',
      phone: '+234 801 234 5678',
      address: '123 Victoria Island, Lagos',
      bio: 'Experienced real estate professional with over 10 years in the luxury property market. Specializing in high-end residential and commercial properties across Lagos.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      joinDate: '2020-03-15',
      rating: 4.9,
      totalSales: 45
    },
    business: {
      companyName: 'Naija Luxury Homes',
      licenseNumber: 'REA-2020-001',
      specialization: 'Luxury Residential & Commercial',
      experience: '10+ years',
      languages: ['English', 'Yoruba', 'French'],
      certifications: ['Real Estate License', 'Property Management', 'Investment Analysis']
    },
    social: {
      website: 'https://naijaluxury.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
      instagram: 'https://instagram.com/johndoe'
    }
  });

  const [formData, setFormData] = useState(profileData);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setProfileData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: FaUser },
    { id: 'business', label: 'Business Info', icon: FaBuilding },
    { id: 'social', label: 'Social Links', icon: FaStar }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your vendor profile and business information</p>
          </div>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaTimes className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaEdit className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-6">
          <AvatarUpload
            currentAvatar={profileData.personal.avatar ? { url: profileData.personal.avatar } : null}
            onAvatarChange={(avatarData) => {
              if (avatarData) {
                setProfileData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, avatar: avatarData.url }
                }));
              } else {
                setProfileData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, avatar: null }
                }));
              }
            }}
            size="large"
            disabled={!isEditing}
            showEditButton={isEditing}
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {profileData.personal.firstName} {profileData.personal.lastName}
            </h2>
            <p className="text-gray-600 mb-2">{profileData.business.companyName}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <FaStar className="h-4 w-4 text-yellow-500" />
                <span>{profileData.personal.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaBuilding className="h-4 w-4" />
                <span>{profileData.personal.totalSales} Sales</span>
              </div>
              <div className="flex items-center space-x-1">
                <FaCalendarAlt className="h-4 w-4" />
                <span>Joined {new Date(profileData.personal.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.personal.firstName}
                      onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.personal.lastName}
                      onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.personal.email}
                      onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.personal.phone}
                      onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.personal.address}
                    onChange={(e) => handleInputChange('personal', 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.personal.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={formData.personal.bio}
                    onChange={(e) => handleInputChange('personal', 'bio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.personal.bio}</p>
                )}
              </div>
            </div>
          )}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.business.companyName}
                      onChange={(e) => handleInputChange('business', 'companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.companyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.business.licenseNumber}
                      onChange={(e) => handleInputChange('business', 'licenseNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.licenseNumber}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.business.specialization}
                      onChange={(e) => handleInputChange('business', 'specialization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.specialization}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.business.experience}
                      onChange={(e) => handleInputChange('business', 'experience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.experience}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.business.languages.join(', ')}
                    onChange={(e) => handleInputChange('business', 'languages', e.target.value.split(', '))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="English, Yoruba, French"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.business.languages.join(', ')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.business.certifications.join(', ')}
                    onChange={(e) => handleInputChange('business', 'certifications', e.target.value.split(', '))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Real Estate License, Property Management"
                  />
                ) : (
                  <div className="space-y-2">
                    {profileData.business.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FaCheck className="h-4 w-4 text-green-500" />
                        <span className="text-gray-900">{cert}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.social.website}
                    onChange={(e) => handleInputChange('social', 'website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.website}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.social.linkedin}
                    onChange={(e) => handleInputChange('social', 'linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.linkedin}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.social.twitter}
                    onChange={(e) => handleInputChange('social', 'twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="https://twitter.com/yourhandle"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.twitter}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.social.instagram}
                    onChange={(e) => handleInputChange('social', 'instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="https://instagram.com/yourhandle"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.instagram}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
