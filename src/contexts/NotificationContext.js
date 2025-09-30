import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false });

  // Initialize notification service when user is available
  useEffect(() => {
    if (user && user._id) {
      notificationService.initialize(user._id);
      
      // Listen for connection status changes
      const unsubscribeConnection = notificationService.on('connection', (status) => {
        setConnectionStatus(status);
      });

      // Listen for new notifications
      const unsubscribeNotification = notificationService.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission is granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      });

      // Listen for admin notifications
      const unsubscribeAdminNotification = notificationService.on('admin_notification', (notification) => {
        // Handle admin notifications differently if needed
        console.log('Admin notification received:', notification);
      });

      // Load initial notifications
      loadNotifications();
      loadUnreadCount();

      // Cleanup on unmount
      return () => {
        unsubscribeConnection();
        unsubscribeNotification();
        unsubscribeAdminNotification();
        notificationService.disconnect();
      };
    }
  }, [user]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadNotifications = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        page: 1,
        limit: 50,
        ...options
      });
      
      if (result.success) {
        setNotifications(result.data.notifications);
      } else {
        console.error('Failed to load notifications:', result.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, status: 'read', readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            status: 'read',
            readAt: new Date()
          }))
        );
        setUnreadCount(0);
      }
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const archiveNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.archiveNotification(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, status: 'archived', archivedAt: new Date() }
              : notification
          )
        );
      }
      return result;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
        // Check if the deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && deletedNotification.status === 'unread') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }, [notifications]);

  const createTestNotification = useCallback(async (notificationData) => {
    try {
      const result = await notificationService.createTestNotification(notificationData);
      return result;
    } catch (error) {
      console.error('Error creating test notification:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const refreshNotifications = useCallback(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => notification.status === 'unread');
  }, [notifications]);

  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(notification => notification.priority === priority);
  }, [notifications]);

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    connectionStatus,
    
    // Actions
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    createTestNotification,
    refreshNotifications,
    
    // Utilities
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationsByPriority,
    
    // Service
    notificationService
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
