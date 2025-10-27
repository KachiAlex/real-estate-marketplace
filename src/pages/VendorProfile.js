import React, { useState, useEffect } from 'react';
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
import MemoryInput from '../components/MemoryInput';
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
      email: user?.email || 'john.doe@kikiestate.com', // Use login email from auth
      phone: '+234 801 234 5678',
      address: '123 Victoria Island, Lagos',
      bio: 'Experienced real estate professional with over 10 years in the luxury property market. Specializing in high-end residential and commercial properties across Lagos.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      joinDate: '2020-03-15',
      rating: 4.9,
      totalSales: 45
    },
    business: {
      companyName: 'KIKI ESTATES',
      licenseNumber: 'REA-2020-001',
      specialization: 'Luxury Residential & Commercial',
      experience: '10+ years',
      languages: ['English', 'Yoruba', 'French'],
      certifications: ['Real Estate License', 'Property Management', 'Investment Analysis']
    },
    social: {
      website: 'https://kikiestate.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
      instagram: 'https://instagram.com/johndoe'
    }
  });

  const [formData, setFormData] = useState(profileData);

  // Load profile data from localStorage on component mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('vendorProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData(parsedProfile);
        setFormData(parsedProfile);
      }
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
    }
  }, []);

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
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('vendorProfile', JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving profile to localStorage:', error);
    }
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
                const newAvatarUrl = avatarData.url;
                setProfileData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, avatar: newAvatarUrl }
                }));
                setFormData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, avatar: newAvatarUrl }
                }));
              } else {
                setProfileData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, avatar: null }
                }));
                setFormData(prev => ({
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
                    <MemoryInput
                      fieldKey="vendor.personal.firstName"
                      value={formData.personal.firstName}
                      onChange={(val) => handleInputChange('personal', 'firstName', val)}
                      placeholder="First name"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <MemoryInput
                      fieldKey="vendor.personal.lastName"
                      value={formData.personal.lastName}
                      onChange={(val) => handleInputChange('personal', 'lastName', val)}
                      placeholder="Last name"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-gray-400 text-xs">(Locked)</span>
                  </label>
                  <input
                      type="email"
                      value={formData.personal.email}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <MemoryInput
                      fieldKey="vendor.personal.phone"
                      value={formData.personal.phone}
                      onChange={(val) => handleInputChange('personal', 'phone', val)}
                      placeholder="+234..."
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.personal.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.personal.address"
                    value={formData.personal.address}
                    onChange={(val) => handleInputChange('personal', 'address', val)}
                    placeholder="Address"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.personal.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.personal.bio"
                    value={formData.personal.bio}
                    onChange={(val) => handleInputChange('personal', 'bio', val)}
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself"
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
                    <MemoryInput
                      fieldKey="vendor.business.companyName"
                      value={formData.business.companyName}
                      onChange={(val) => handleInputChange('business', 'companyName', val)}
                      placeholder="Company name"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.companyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  {isEditing ? (
                    <MemoryInput
                      fieldKey="vendor.business.licenseNumber"
                      value={formData.business.licenseNumber}
                      onChange={(val) => handleInputChange('business', 'licenseNumber', val)}
                      placeholder="License number"
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
                    <MemoryInput
                      fieldKey="vendor.business.specialization"
                      value={formData.business.specialization}
                      onChange={(val) => handleInputChange('business', 'specialization', val)}
                      placeholder="Specialization"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.specialization}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  {isEditing ? (
                    <MemoryInput
                      fieldKey="vendor.business.experience"
                      value={formData.business.experience}
                      onChange={(val) => handleInputChange('business', 'experience', val)}
                      placeholder="Experience"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.business.experience}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.business.languages"
                    value={formData.business.languages.join(', ')}
                    onChange={(val) => handleInputChange('business', 'languages', val.split(', '))}
                    placeholder="English, Yoruba, French"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.business.languages.join(', ')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.business.certifications"
                    value={formData.business.certifications.join(', ')}
                    onChange={(val) => handleInputChange('business', 'certifications', val.split(', '))}
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
                  <MemoryInput
                    fieldKey="vendor.social.website"
                    value={formData.social.website}
                    onChange={(val) => handleInputChange('social', 'website', val)}
                    placeholder="https://yourwebsite.com"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.website}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.social.linkedin"
                    value={formData.social.linkedin}
                    onChange={(val) => handleInputChange('social', 'linkedin', val)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.linkedin}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.social.twitter"
                    value={formData.social.twitter}
                    onChange={(val) => handleInputChange('social', 'twitter', val)}
                    placeholder="https://twitter.com/yourhandle"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.social.twitter}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                {isEditing ? (
                  <MemoryInput
                    fieldKey="vendor.social.instagram"
                    value={formData.social.instagram}
                    onChange={(val) => handleInputChange('social', 'instagram', val)}
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

