import io from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiConfig';
import apiClient from './apiClient';
import { getAuthToken } from '../utils/authToken';

class NotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize the notification service
  initialize(userId) {
    if (!userId) {
      console.warn('NotificationService: User ID is required');
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      console.warn('NotificationService: No authentication token found');
      return;
    }

    // Connect to Socket.IO server
    this.socket = io(getApiBaseUrl(), {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ NotificationService: Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user-specific room
      this.socket.emit('join_user_room', userId);
      
      // Notify listeners of connection
      this.notifyListeners('connection', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ NotificationService: Disconnected from server:', reason);
      this.isConnected = false;
      this.notifyListeners('connection', { connected: false });
      
      // Attempt to reconnect if not intentional
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 NotificationService: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ NotificationService: Connection error:', error);
      this.isConnected = false;
      this.notifyListeners('connection', { connected: false, error });
    });

    // Notification event handlers
    this.socket.on('notification', (notification) => {
      console.log('🔔 NotificationService: Received notification:', notification);
      this.notifyListeners('notification', notification);
    });

    this.socket.on('admin_notification', (notification) => {
      console.log('🔔 NotificationService: Received admin notification:', notification);
      this.notifyListeners('admin_notification', notification);
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Remove event listener
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket ? this.socket.id : null
    };
  }

  // API methods for notifications
  async getNotifications(options = {}) {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const queryParams = new URLSearchParams(options).toString();
      const resp = await apiClient.get(`/notifications?${queryParams}`);
      return resp.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }
  }

  async markAsRead(notificationId) {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const resp = await apiClient.put(`/notifications/${notificationId}/read`);
      return resp.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  async markAllAsRead() {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const resp = await apiClient.put('/notifications/read-all');
      return resp.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  async archiveNotification(notificationId) {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const resp = await apiClient.put(`/notifications/${notificationId}/archive`);
      return resp.data;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteNotification(notificationId) {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const resp = await apiClient.delete(`/notifications/${notificationId}`);
      return resp.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }

  async createInspectionNotifications(notifications = []) {
    try {
      if (!notifications.length) {
        return { success: false, message: 'No notifications to persist' };
      }
      const accessToken = await getAuthToken();
      if (!accessToken) {
        return { success: false, message: 'Missing auth token' };
      }

      const resp = await apiClient.post('/notifications/inspection', { notifications });
      return resp.data;
    } catch (error) {
      console.error('Error creating inspection notifications:', error);
      return { success: false, error: error.message };
    }
  }

  async getUnreadCount() {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const resp = await apiClient.get('/notifications/unread/count');
      return resp.data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: error.message };
    }
  }

  // Create test notification (admin only)
  async createTestNotification(notificationData) {
    try {
      const accessToken = await getAuthToken();
      if (!accessToken) return { success: false, message: 'Not authenticated' };
      const resp = await apiClient.post('/notifications/test', notificationData);
      return resp.data;
    } catch (error) {
      console.error('Error creating test notification:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;
