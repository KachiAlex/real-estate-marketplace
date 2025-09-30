import React, { useState, useRef, useEffect } from 'react';
import { 
  FaBell, 
  FaTimes, 
  FaCheck, 
  FaArchive, 
  FaTrash, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';
import toast from 'react-hot-toast';

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    setActionLoading(notificationId);
    try {
      const result = await markAsRead(notificationId);
      if (result.success) {
        toast.success('Notification marked as read');
      } else {
        toast.error(result.message || 'Failed to mark as read');
      }
    } catch (error) {
      toast.error('Error marking notification as read');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading('all');
    try {
      const result = await markAllAsRead();
      if (result.success) {
        toast.success('All notifications marked as read');
      } else {
        toast.error(result.message || 'Failed to mark all as read');
      }
    } catch (error) {
      toast.error('Error marking all notifications as read');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (notificationId) => {
    setActionLoading(notificationId);
    try {
      const result = await archiveNotification(notificationId);
      if (result.success) {
        toast.success('Notification archived');
      } else {
        toast.error(result.message || 'Failed to archive');
      }
    } catch (error) {
      toast.error('Error archiving notification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      setActionLoading(notificationId);
      try {
        const result = await deleteNotification(notificationId);
        if (result.success) {
          toast.success('Notification deleted');
        } else {
          toast.error(result.message || 'Failed to delete');
        }
      } catch (error) {
        toast.error('Error deleting notification');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconClass = `text-lg ${
      priority === 'urgent' ? 'text-red-500' :
      priority === 'high' ? 'text-orange-500' :
      priority === 'medium' ? 'text-blue-500' :
      'text-gray-500'
    }`;

    switch (type) {
      case 'property_verified':
        return <FaCheckCircle className={iconClass} />;
      case 'property_rejected':
        return <FaTimesCircle className={iconClass} />;
      case 'escrow_created':
      case 'escrow_payment_received':
      case 'escrow_completed':
        return <FaCheckCircle className={iconClass} />;
      case 'escrow_disputed':
      case 'escrow_timeout':
        return <FaExclamationTriangle className={iconClass} />;
      case 'user_suspended':
        return <FaTimesCircle className={iconClass} />;
      case 'user_activated':
        return <FaCheckCircle className={iconClass} />;
      default:
        return <FaInfoCircle className={iconClass} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading === 'all'}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {actionLoading === 'all' ? (
                  <FaSpinner className="animate-spin inline mr-1" />
                ) : (
                  <FaCheck className="inline mr-1" />
                )}
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-2xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                      notification.status === 'unread' ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          
                          {notification.status === 'unread' && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2 mt-3">
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              disabled={actionLoading === notification._id}
                              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                              {actionLoading === notification._id ? (
                                <FaSpinner className="animate-spin inline mr-1" />
                              ) : (
                                <FaCheck className="inline mr-1" />
                              )}
                              Mark read
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleArchive(notification._id)}
                            disabled={actionLoading === notification._id}
                            className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          >
                            {actionLoading === notification._id ? (
                              <FaSpinner className="animate-spin inline mr-1" />
                            ) : (
                              <FaArchive className="inline mr-1" />
                            )}
                            Archive
                          </button>
                          
                          <button
                            onClick={() => handleDelete(notification._id)}
                            disabled={actionLoading === notification._id}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {actionLoading === notification._id ? (
                              <FaSpinner className="animate-spin inline mr-1" />
                            ) : (
                              <FaTrash className="inline mr-1" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={refreshNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
