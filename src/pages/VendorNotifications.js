import React, { useState } from 'react';
import { 
  FaBell, 
  FaCheck, 
  FaTimes, 
  FaTrash, 
  FaFilter,
  FaSearch,
  FaEnvelope,
  FaCalendarAlt,
  FaUser,
  FaHome,
  FaDollarSign,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

const VendorNotifications = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'inquiry',
      title: 'New Property Inquiry',
      message: 'John Smith has inquired about your Luxury Villa in Ikoyi',
      timestamp: '2024-01-15T10:30:00Z',
      isRead: false,
      priority: 'high',
      icon: FaEnvelope,
      color: 'blue'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Received',
      message: 'Commission payment of ₦150,000 has been processed for Villa sale',
      timestamp: '2024-01-15T09:15:00Z',
      isRead: false,
      priority: 'high',
      icon: FaDollarSign,
      color: 'green'
    },
    {
      id: 3,
      type: 'appointment',
      title: 'Property Viewing Scheduled',
      message: 'Property viewing scheduled for Modern Apartment on Jan 20, 2024 at 2:00 PM',
      timestamp: '2024-01-14T16:45:00Z',
      isRead: true,
      priority: 'medium',
      icon: FaCalendarAlt,
      color: 'purple'
    },
    {
      id: 4,
      type: 'system',
      title: 'Profile Update Required',
      message: 'Please update your business license information to maintain active status',
      timestamp: '2024-01-14T14:20:00Z',
      isRead: true,
      priority: 'medium',
      icon: FaInfoCircle,
      color: 'orange'
    },
    {
      id: 5,
      type: 'alert',
      title: 'Market Alert',
      message: 'Property prices in Victoria Island have increased by 15% this month',
      timestamp: '2024-01-13T11:30:00Z',
      isRead: true,
      priority: 'low',
      icon: FaExclamationTriangle,
      color: 'yellow'
    },
    {
      id: 6,
      type: 'inquiry',
      title: 'New Property Inquiry',
      message: 'Sarah Johnson is interested in your Commercial Space listing',
      timestamp: '2024-01-13T08:15:00Z',
      isRead: true,
      priority: 'medium',
      icon: FaEnvelope,
      color: 'blue'
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getIconColor = (color) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const markAsRead = (id) => {
    // In a real app, this would make an API call
    console.log('Marking notification as read:', id);
  };

  const markAllAsRead = () => {
    // In a real app, this would make an API call
    console.log('Marking all notifications as read');
  };

  const deleteNotification = (id) => {
    // In a real app, this would make an API call
    console.log('Deleting notification:', id);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your property activities and important alerts</p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCheck className="h-4 w-4" />
                <span>Mark All Read</span>
              </button>
            )}
            <div className="relative">
              <FaBell className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaBell className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaEnvelope className="text-red-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inquiries</p>
              <p className="text-2xl font-bold text-green-600">{notifications.filter(n => n.type === 'inquiry').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaUser className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payments</p>
              <p className="text-2xl font-bold text-purple-600">{notifications.filter(n => n.type === 'payment').length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-purple-600 text-xl" />
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
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400 h-4 w-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="inquiry">Inquiries</option>
              <option value="payment">Payments</option>
              <option value="appointment">Appointments</option>
              <option value="system">System</option>
              <option value="alert">Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaBell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-md border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.isRead ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColor(notification.color)} bg-white shadow-sm`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="mt-2 text-gray-600">{notification.message}</p>
                      
                      <div className="mt-4 flex items-center space-x-3">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <FaCheck className="h-3 w-3" />
                            <span>Mark as read</span>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                        >
                          <FaTrash className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VendorNotifications;
