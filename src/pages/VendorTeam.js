import React, { useState } from 'react';
import { 
  FaUsers, 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaEnvelope, 
  FaPhone,
  FaSearch,
  FaFilter,
  FaCrown,
  FaStar
} from 'react-icons/fa';

const VendorTeam = () => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingMember, setEditingMember] = useState(null);

  // Team management handlers
  const handleEditMember = (member) => {
    setEditingMember(member);
    // You can open an edit modal or navigate to edit page
    console.log('Edit member:', member.id);
  };

  const handleRemoveMember = (member) => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
      console.log('Remove member:', member.id);
      // You can implement member removal here
    }
  };

  // Mock team data
  const teamMembers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Senior Agent',
      email: 'sarah.johnson@naijaluxury.com',
      phone: '+234 801 234 5678',
      joinDate: '2023-01-15',
      propertiesSold: 25,
      rating: 4.9,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Michael Brown',
      role: 'Junior Agent',
      email: 'michael.brown@naijaluxury.com',
      phone: '+234 802 345 6789',
      joinDate: '2023-06-20',
      propertiesSold: 12,
      rating: 4.7,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Emily Davis',
      role: 'Marketing Specialist',
      email: 'emily.davis@naijaluxury.com',
      phone: '+234 803 456 7890',
      joinDate: '2023-03-10',
      propertiesSold: 8,
      rating: 4.8,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 4,
      name: 'David Wilson',
      role: 'Senior Agent',
      email: 'david.wilson@naijaluxury.com',
      phone: '+234 804 567 8901',
      joinDate: '2022-11-05',
      propertiesSold: 35,
      rating: 4.9,
      status: 'inactive',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role.toLowerCase().includes(filterRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'Senior Agent': return 'bg-purple-100 text-purple-800';
      case 'Junior Agent': return 'bg-blue-100 text-blue-800';
      case 'Marketing Specialist': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600">Manage your real estate team members and their performance</p>
          </div>
          <button 
            onClick={() => setShowAddMember(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaUserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Team Members</p>
              <p className="text-2xl font-bold text-blue-600">{teamMembers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-green-600">{teamMembers.filter(m => m.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCrown className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties Sold</p>
              <p className="text-2xl font-bold text-purple-600">{teamMembers.reduce((sum, m) => sum + m.propertiesSold, 0)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaStar className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-orange-600">
                {(teamMembers.reduce((sum, m) => sum + m.rating, 0) / teamMembers.length).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaStar className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400 h-4 w-4" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="senior">Senior Agent</option>
              <option value="junior">Junior Agent</option>
              <option value="marketing">Marketing Specialist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FaEnvelope className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FaPhone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{member.propertiesSold}</p>
                  <p className="text-xs text-gray-500">Properties Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{member.rating}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  member.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.status}
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditMember(member)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Member"
                  >
                    <FaEdit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleRemoveMember(member)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove Member"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Team Member</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent">
                  <option value="">Select role</option>
                  <option value="Senior Agent">Senior Agent</option>
                  <option value="Junior Agent">Junior Agent</option>
                  <option value="Marketing Specialist">Marketing Specialist</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorTeam;