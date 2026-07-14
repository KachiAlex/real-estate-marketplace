import { getApiUrl } from '../utils/apiConfig';
import apiClient from '../services/apiClient';

// Chat service for handling admin chat support functionality

export const chatService = {
  // Get all conversations for admin
  getConversations: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      
      const resp = await apiClient.get(`/admin/chat/conversations?${queryParams.toString()}`);
      const data = resp.data;
      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to fetch conversations');
      }
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get a specific conversation with messages
  getConversation: async (conversationId) => {
    try {
      const resp = await apiClient.get(`/admin/chat/conversations/${conversationId}`);
      const data = resp.data;
      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to fetch conversation');
      }
      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Send a message as admin
  sendMessage: async (conversationId, message, isAdmin = true) => {
    try {
      const resp = await apiClient.post('/admin/chat/send', { conversationId, message, isAdmin });
      return resp.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    try {
      const resp = await apiClient.post(`/admin/chat/conversations/${conversationId}/read`);
      return resp.data;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  // Assign conversation to admin
  assignConversation: async (conversationId, adminId) => {
    try {
      const resp = await apiClient.post(`/admin/chat/conversations/${conversationId}/assign`, { adminId });
      return resp.data;
    } catch (error) {
      console.error('Error assigning conversation:', error);
      throw error;
    }
  },

  // Update conversation priority
  updatePriority: async (conversationId, priority) => {
    try {
      const resp = await apiClient.post(`/admin/chat/conversations/${conversationId}/priority`, { priority });
      return resp.data;
    } catch (error) {
      console.error('Error updating priority:', error);
      throw error;
    }
  },

  // Archive conversation
  archiveConversation: async (conversationId) => {
    try {
      const resp = await apiClient.post(`/admin/chat/conversations/${conversationId}/archive`);
      return resp.data;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  },

  // Get chat statistics
  getChatStats: async () => {
    try {
      const resp = await apiClient.get('/admin/chat/stats');
      if (!resp?.data || !resp.data.success) throw new Error('Failed to fetch chat statistics');
      return resp.data;
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      throw error;
    }
  },

  // Create new conversation (for when buyer/vendor initiates chat)
  createConversation: async (userId, message, category, propertyId = null) => {
    try {
      const resp = await apiClient.post('/admin/chat/conversations', { userId, message, category, propertyId });
      return resp.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Get canned responses for quick replies
  getCannedResponses: async () => {
    try {
      const response = await authenticatedFetch(
        getApiUrl('/admin/chat/canned-responses')
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch canned responses');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching canned responses:', error);
      throw error;
    }
  },

  // Add canned response
  addCannedResponse: async (title, message, category) => {
    try {
      const resp = await apiClient.post('/admin/chat/canned-responses', { title, message, category });
      return resp.data;
    } catch (error) {
      console.error('Error adding canned response:', error);
      throw error;
    }
  }
};

export default chatService;
